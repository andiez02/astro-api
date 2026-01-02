/**
 * =============================================================================
 * App Configuration - Astro NFT Marketplace
 * =============================================================================
 * Định nghĩa các cấu hình ứng dụng với type-safe
 * =============================================================================
 */

import { Injectable } from '@nestjs/common';
import { ConfigService, registerAs } from '@nestjs/config';

// =============================================================================
// Application Config
// =============================================================================
export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  logLevel: process.env.LOG_LEVEL || 'debug',
}));

// =============================================================================
// Database Config
// =============================================================================
export const databaseConfig = registerAs('database', () => ({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
  name: process.env.DATABASE_NAME || 'krypto_nft_db',
  user: process.env.DATABASE_USER || 'krypto_user',
  password: process.env.DATABASE_PASSWORD || 'krypto_password_2024',
  url: process.env.DATABASE_URL,
}));

// =============================================================================
// App Config Service - Type-safe config access
// =============================================================================
@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  // Application
  get nodeEnv(): string {
    return this.configService.get<string>('app.nodeEnv') ?? 'development';
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get port(): number {
    return this.configService.get<number>('app.port') ?? 3000;
  }

  get apiPrefix(): string {
    return this.configService.get<string>('app.apiPrefix') ?? 'api/v1';
  }

  get corsOrigin(): string | string[] {
    const origin = this.configService.get<string>('app.corsOrigin') ?? process.env.CORS_ORIGIN ?? 'http://localhost:3001';
    
    // Support multiple origins separated by comma
    if (origin.includes(',')) {
      return origin.split(',').map(o => o.trim());
    }
    
    return origin.trim();
  }

  get logLevel(): string {
    return this.configService.get<string>('app.logLevel') ?? 'debug';
  }

  // Database
  get databaseUrl(): string {
    return this.configService.get<string>('database.url') ?? '';
  }
}
