/**
 * =============================================================================
 * Config Module - Astro NFT Marketplace
 * =============================================================================
 * Module quản lý cấu hình ứng dụng từ biến môi trường
 * Sử dụng @nestjs/config để load và validate env variables
 * =============================================================================
 */

import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { appConfig, databaseConfig, AppConfigService } from './app.config';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true, 
      envFilePath: ['.env', '.env.local'],
      load: [appConfig, databaseConfig], 
      cache: true, 
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class ConfigModule {}
