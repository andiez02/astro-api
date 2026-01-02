import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { DatabaseModule } from '@/database/database.module';
import { UsersModule } from '../users/users.module';

/**
 * Authentication Module
 * 
 * Provides SIWE (Sign-In with Ethereum) authentication with JWT tokens.
 * 
 * Endpoints:
 * - GET /auth/nonce?address=0x... - Get nonce for SIWE message
 * - POST /auth/login - Verify SIWE signature and get JWT token
 * 
 * Exports:
 * - JwtAuthGuard - Use to protect routes requiring authentication
 */
@Module({
  imports: [
    // Passport for authentication strategies
    PassportModule.register({ defaultStrategy: 'jwt' }),
    
    // JWT configuration
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET environment variable is not set');
        }
        return {
          secret,
          signOptions: { expiresIn: '7d' },
        };
      },
      inject: [ConfigService],
    }),
    
    // Database access for JWT strategy
    DatabaseModule,
    
    // Users service for authentication logic
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  exports: [JwtAuthGuard, JwtModule],
})
export class AuthModule {}
