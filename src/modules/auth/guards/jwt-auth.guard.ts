import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Authentication Guard
 * 
 * Protects routes that require authentication.
 * Validates the JWT token from the Authorization header.
 * 
 * Usage:
 * @UseGuards(JwtAuthGuard)
 * @Get('protected')
 * async protectedRoute(@Request() req: RequestWithUser) {
 *   // req.user contains the authenticated user
 * }
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Call the parent canActivate to run the JWT strategy
    return super.canActivate(context);
  }

  handleRequest<TUser>(err: Error | null, user: TUser, info: Error | null): TUser {
    // Handle errors from JWT validation
    if (err || !user) {
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired. Please login again.');
      }
      if (info?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token. Please login again.');
      }
      throw new UnauthorizedException('Authentication required. Please login.');
    }
    return user;
  }
}

