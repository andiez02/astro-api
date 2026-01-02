/**
 * =============================================================================
 * Main Entry Point - Astro NFT Marketplace Backend
 * =============================================================================
 * File khởi tạo ứng dụng NestJS
 * Cấu hình: CORS, Validation Pipe, Global Filters/Interceptors
 * =============================================================================
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app.config';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Tạo ứng dụng NestJS
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Lấy config services
  const configService = app.get(ConfigService);
  const appConfigService = app.get(AppConfigService);
  const port = appConfigService.port;
  const apiPrefix = appConfigService.apiPrefix;

  // ==========================================================================
  // API Prefix
  // ==========================================================================
  app.setGlobalPrefix(apiPrefix);

  // ==========================================================================
  // CORS Configuration
  // ==========================================================================
  const corsOrigin = appConfigService.corsOrigin;
  logger.log(`🔒 CORS Origin: ${JSON.stringify(corsOrigin)}`);
  
  app.enableCors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Cache-Control',
      'Pragma',
      'Accept',
      'Accept-Language',
      'X-Requested-With',
    ],
    exposedHeaders: ['Authorization'],
    credentials: true,
  });

  // ==========================================================================
  // Global Pipes - Validation
  // ==========================================================================
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Loại bỏ các field không được định nghĩa trong DTO
      forbidNonWhitelisted: true, // Throw error nếu có field không hợp lệ
      transform: true, // Tự động transform types
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ==========================================================================
  // Global Filters & Interceptors
  // ==========================================================================
  app.useGlobalFilters(new GlobalExceptionFilter(configService));
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  // ==========================================================================
  // Start Server
  // ==========================================================================
  await app.listen(port);

  logger.log('='.repeat(60));
  logger.log(`🚀 Astro NFT Marketplace Backend`);
  logger.log(`📍 Environment: ${appConfigService.nodeEnv}`);
  logger.log(`🌐 Server running on: http://localhost:${port}`);
  logger.log(`📡 API Prefix: /${apiPrefix}`);
  logger.log(`❤️  Health Check: http://localhost:${port}/${apiPrefix}/health`);
  logger.log('='.repeat(60));
}

bootstrap();
