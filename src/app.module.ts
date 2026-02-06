/**
 * =============================================================================
 * App Module - Astro NFT Marketplace
 * =============================================================================
 * Root module của ứng dụng NestJS
 * Import và kết nối tất cả các module con
 * =============================================================================
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CollectionsModule } from './modules/collections/collections.module';
import { UploadModule } from './modules/upload/upload.module';
import { NftsModule } from './modules/nfts/nfts.module';
import { IndexerModule } from './indexer/indexer.module';

@Module({
  imports: [
    // Config Module - Load biến môi trường (phải import đầu tiên)
    ConfigModule,

    // Database Module - Kết nối PostgreSQL qua Prisma
    DatabaseModule,

    // Feature Modules
    HealthModule,

    AuthModule,

    UsersModule,

    CollectionsModule,

    UploadModule,

    NftsModule,

    IndexerModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
