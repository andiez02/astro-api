import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // --- PHẦN DÀNH CHO AUTH MODULE GỌI ---

  // 1. Tìm user theo Address (AuthService sẽ dùng cái này để verify)
  async findByAddress(walletAddress: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        walletAddress: walletAddress.toLowerCase(),
      },
    });
  }

  // 2. Tạo hoặc Update Nonce (Logic cốt lõi của SIWE)
  // Nếu user chưa tồn tại -> Tạo mới kèm nonce
  // Nếu user đã tồn tại -> Update nonce mới
  async upsertNonce(walletAddress: string, nonce: string): Promise<User> {
    const lowerAddress = walletAddress.toLowerCase();

    return this.prisma.user.upsert({
      where: { walletAddress: lowerAddress },
      create: {
        walletAddress: lowerAddress,
        nonce: nonce,
        username: lowerAddress.slice(0, 8), // Default username tạm
      },
      update: {
        nonce: nonce,
      },
    });
  }

  // 3. Update Nonce sau khi login thành công (để chống Replay Attack)
  async updateNonce(userId: string, newNonce: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { nonce: newNonce },
    });
  }

  // --- PHẦN DÀNH CHO USER PROFILE ---

  // 4. Lấy thông tin bản thân (Me)
  async findById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // 5. Update Profile
  async updateProfile(id: string, dto: UpdateUserDto): Promise<User> {
    // Check trùng username nếu user có đổi
    if (dto.username) {
      const exists = await this.prisma.user.findFirst({
        where: { username: dto.username },
      });
      if (exists && exists.id !== id) {
        throw new ConflictException('Username already exists');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: { ...dto },
    });
  }
}