import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SiweMessage, generateNonce } from 'siwe';
import { UsersService } from '../users/users.service';
import { LoginResponseDto, JwtPayload, UserInfoDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Generate a nonce for SIWE authentication
   * 
   * Flow:
   * 1. Normalize wallet address to lowercase
   * 2. Generate cryptographically secure random nonce
   * 3. Upsert user/wallet with new nonce (create if not exists)
   * 4. Return nonce for client to include in SIWE message
   * 
   * @param walletAddress - Ethereum wallet address
   * @returns The generated nonce string
   */
  async getNonce(walletAddress: string): Promise<string> {
    if (!walletAddress) {
      throw new BadRequestException('Wallet address is required');
    }

    // Normalize address to lowercase for consistency
    const normalizedAddress = walletAddress.toLowerCase();
    
    // Generate cryptographically secure random nonce using siwe library
    const nonce = generateNonce();
    
    // Upsert user/wallet: create if not exists, update nonce if exists
    await this.usersService.upsertNonce(normalizedAddress, nonce);
    
    this.logger.debug(`Generated nonce for address: ${normalizedAddress}`);
    
    return nonce;
  }

  /**
   * Login with SIWE - Verify signature and issue JWT
   * 
   * Flow:
   * 1. Parse the SIWE message
   * 2. Verify the cryptographic signature
   * 3. SECURITY CHECK: Compare nonce in message with nonce in Wallet
   * 4. ANTI-REPLAY: Generate new nonce immediately after verification
   * 5. ISSUE TOKEN: Generate JWT accessToken with user info
   * 6. Return { accessToken, user }
   * 
   * @param message - The SIWE message string signed by wallet
   * @param signature - The cryptographic signature from wallet
   * @returns LoginResponseDto containing accessToken and user info
   */
  async login(message: string, signature: string): Promise<LoginResponseDto> {
    try {
      // Step 1: Parse the SIWE message
      const siweMessage = new SiweMessage(message);
      
      // Step 2: Verify the cryptographic signature
      const { data: fields } = await siweMessage.verify({ signature });
      
      // Normalize address to lowercase
      const normalizedAddress = fields.address.toLowerCase();
      
      // Step 3: Find wallet and perform SECURITY CHECK on nonce
      const wallet = await this.usersService.findWalletByAddress(normalizedAddress);
      
      if (!wallet) {
        this.logger.warn(`Login failed: Wallet not found for address ${normalizedAddress}`);
        throw new UnauthorizedException('Wallet not found. Please request a nonce first.');
      }
      
      if (!wallet.nonce) {
        this.logger.warn(`Login failed: No nonce found for wallet ${normalizedAddress}`);
        throw new UnauthorizedException('No nonce found. Please request a nonce first.');
      }
      
      // CRITICAL: Nonce comparison to prevent replay attacks
      if (wallet.nonce !== fields.nonce) {
        this.logger.warn(`Login failed: Nonce mismatch for wallet ${normalizedAddress}`);
        throw new UnauthorizedException('Invalid or expired nonce. Please request a new nonce.');
      }

      // Find user associated with wallet
      const user = await this.usersService.findByAddress(normalizedAddress);
      
      if (!user) {
        this.logger.warn(`Login failed: User not found for wallet ${normalizedAddress}`);
        throw new UnauthorizedException('User not found. Please request a nonce first.');
      }

      // Step 4: ANTI-REPLAY - Generate new nonce immediately
      // This invalidates the old nonce so it cannot be reused
      const newNonce = generateNonce();
      await this.usersService.updateNonce(normalizedAddress, newNonce);
      
      // Step 5: Generate JWT accessToken
      const payload: JwtPayload = {
        sub: user.id,
        walletAddress: normalizedAddress,
      };
      
      const accessToken = this.jwtService.sign(payload);
      
      this.logger.log(`User logged in successfully: ${user.id}`);

      // Step 6: Return accessToken and user info
      const userInfo: UserInfoDto = {
        id: user.id,
        walletAddress: normalizedAddress,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
      };

      return {
        accessToken,
        user: userInfo,
      };
    } catch (error) {
      // Re-throw UnauthorizedException as-is
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      // Log and wrap other errors (e.g., signature verification failed)
      this.logger.error(`Login failed: ${error.message}`, error.stack);
      throw new UnauthorizedException('Signature verification failed. Please try again.');
    }
  }
}