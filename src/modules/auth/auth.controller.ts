import { Body, Controller, Get, Post, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, LoginResponseDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

/**
 * Authentication Controller
 * 
 * Handles SIWE (Sign-In with Ethereum) authentication flow:
 * 1. GET /auth/nonce?address=0x... - Get a nonce for signing
 * 2. POST /auth/login - Verify signature and get JWT token
 * 3. GET /auth/verify - Verify JWT token validity
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Get a nonce for SIWE authentication
   * 
   * Client Flow:
   * 1. Call GET /auth/nonce?address=0x...
   * 2. Use the returned nonce to construct a SIWE message
   * 3. Sign the message with wallet (MetaMask, WalletConnect, etc.)
   * 4. Send signed message to POST /auth/login
   * 
   * @param address - Ethereum wallet address (will be lowercased)
   * @returns { nonce: string }
   */
  @Get('nonce')
  async getNonce(@Query('address') address: string): Promise<{ nonce: string }> {
    const nonce = await this.authService.getNonce(address);
    return { nonce };
  }

  /**
   * Login with SIWE signature
   * 
   * Verifies the SIWE message signature and returns a JWT token.
   * The token should be included in subsequent requests as:
   * Authorization: Bearer <accessToken>
   * 
   * @param dto - { message: SIWE message, signature: wallet signature }
   * @returns { accessToken: JWT token, user: user info }
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(dto.message, dto.signature);
  }

  /**
   * Verify JWT token validity
   * 
   * This endpoint verifies if the provided JWT token in the Authorization header
   * is still valid (not expired, correct signature, user exists).
   * 
   * Frontend uses this to check if user is still authenticated before making
   * API calls or to refresh authentication state.
   * 
   * Authentication:
   * - Required: Yes
   * - Header: Authorization: Bearer <accessToken>
   * 
   * @returns { valid: boolean } - Returns { valid: true } if token is valid
   * @throws 401 Unauthorized - If token is missing, invalid, or expired
   */
  @Get('verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async verifyToken(): Promise<{ valid: boolean }> {
    // If we reach here, JwtAuthGuard has already verified:
    // - Token signature is valid
    // - Token is not expired
    // - User exists in database
    // Just return valid: true
    return { valid: true };
  }
}