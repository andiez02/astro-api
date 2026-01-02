import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/database/prisma.service';
import { JwtPayload } from '../dto/auth.dto';

/**
 * JWT Strategy for Passport
 * 
 * Validates JWT tokens from the Authorization header.
 * Used by JwtAuthGuard to protect routes.
 * 
 * Usage in controllers:
 * @UseGuards(JwtAuthGuard)
 * @Get('protected')
 * async protectedRoute(@Request() req: RequestWithUser) {
 *   // req.user contains the authenticated user
 * }
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /**
   * Validate the JWT payload and return the user
   * 
   * This method is called by Passport after verifying the JWT signature.
   * The returned value is attached to request.user
   * 
   * @param payload - Decoded JWT payload containing sub (userId) and walletAddress
   * @returns The authenticated user object
   */
  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found or session expired');
    }

    // Return user object - this will be available as req.user
    return user;
  }
}

