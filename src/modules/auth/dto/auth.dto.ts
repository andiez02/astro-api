import { IsString, IsNotEmpty } from 'class-validator';

/**
 * DTO for login request (SIWE verification)
 */
export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'SIWE message is required' })
  message: string;

  @IsString()
  @IsNotEmpty({ message: 'Signature is required' })
  signature: string;
}

/**
 * User info returned after authentication
 */
export class UserInfoDto {
  id: string;
  walletAddress: string;
  username: string | null;
  role: string;
  createdAt: Date;
}

/**
 * Response DTO for successful login
 */
export class LoginResponseDto {
  accessToken: string;
  user: UserInfoDto;
}

/**
 * JWT Payload structure
 */
export interface JwtPayload {
  sub: string;          // User ID
  walletAddress: string;
  iat?: number;         // Issued at
  exp?: number;         // Expiration
}

