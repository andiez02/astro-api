import { Controller, Get, Body, Patch, Param, UseGuards, Request, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; 
import { RequestWithUser } from '@/common/interfaces/requests.interface';
import { UserResponseDto } from './dto/user-response.dto';
import { plainToInstance } from 'class-transformer';

@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 1. Lấy thông tin bản thân (Private)
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req: RequestWithUser): Promise<UserResponseDto> {
    const userId = req.user.id; 
    const user = await this.usersService.findById(userId);
    return plainToInstance(UserResponseDto, user);
  }

  // 2. Cập nhật thông tin (Private)
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateProfile(@Request() req: RequestWithUser, @Body() dto: UpdateUserDto): Promise<UserResponseDto> {
    const userId = req.user.id;
    const user = await this.usersService.updateProfile(userId, dto);
    return plainToInstance(UserResponseDto, user);
  }

  @Get(':address')
  async getPublicProfile(@Param('address') address: string) {
    const user = await this.usersService.findByAddress(address);
    if (!user) return { message: 'User not found' };

    // Chỉ trả về thông tin public
    return {
      id: user.id,
      username: user.username,
      walletAddress: user.walletAddress,
      avatar: user.avatar,
      bio: user.bio,
      createdAt: user.createdAt,
    };
  }
}