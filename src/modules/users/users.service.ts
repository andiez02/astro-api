import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, Wallet } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // --- PHẦN DÀNH CHO AUTH MODULE GỌI ---

  // 1. Tìm user theo Address (AuthService sẽ dùng cái này để verify)
  async findByAddress(walletAddress: string): Promise<User | null> {
    const lowerAddress = walletAddress.toLowerCase();

    const wallet = await this.prisma.wallet.findUnique({
      where: { address: lowerAddress },
      include: { user: true },
    });

    return wallet?.user ?? null;
  }

  // 2. Tìm wallet theo address (để lấy nonce cho SIWE verify)
  async findWalletByAddress(walletAddress: string): Promise<Wallet | null> {
    const lowerAddress = walletAddress.toLowerCase();

    return this.prisma.wallet.findUnique({
      where: { address: lowerAddress },
    });
  }

  // 3. Tạo hoặc Update Nonce (Logic cốt lõi của SIWE)
  // Nếu wallet chưa tồn tại -> Tạo User mới + Wallet kèm nonce
  // Nếu wallet đã tồn tại -> Update nonce trên wallet
  async upsertNonce(walletAddress: string, nonce: string): Promise<User> {
    const lowerAddress = walletAddress.toLowerCase();

    // Tìm wallet hiện có
    const existingWallet = await this.prisma.wallet.findUnique({
      where: { address: lowerAddress },
      include: { user: true },
    });

    if (!existingWallet) {
      // Tạo User mới + Wallet mới
      const user = await this.prisma.user.create({
        data: {
          username: lowerAddress.slice(0, 8),
          wallets: {
            create: {
              address: lowerAddress,
              nonce,
            },
          },
        },
      });
      return user;
    }

    // Update nonce trên wallet
    await this.prisma.wallet.update({
      where: { address: lowerAddress },
      data: { nonce },
    });

    // Nếu wallet chưa có user, tạo user mới
    if (!existingWallet.user) {
      const user = await this.prisma.user.create({
        data: {
          username: lowerAddress.slice(0, 8),
          wallets: {
            connect: { address: lowerAddress },
          },
        },
      });
      return user;
    }

    return existingWallet.user;
  }

  // 4. Update Nonce sau khi login thành công (để chống Replay Attack)
  async updateNonce(walletAddress: string, newNonce: string): Promise<Wallet> {
    const lowerAddress = walletAddress.toLowerCase();

    return this.prisma.wallet.update({
      where: { address: lowerAddress },
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