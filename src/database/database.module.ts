/**
 * =============================================================================
 * Database Module - Astro NFT Marketplace
 * =============================================================================
 * Module quản lý kết nối database qua Prisma
 * =============================================================================
 */

import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}

