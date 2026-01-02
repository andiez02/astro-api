/**
 * =============================================================================
 * Prisma Service - Astro NFT Marketplace
 * =============================================================================
 * Service wrapper cho Prisma Client
 * Handles lifecycle hooks (onModuleInit, onModuleDestroy)
 * =============================================================================
 */

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private configService: ConfigService) {
    // Get DATABASE_URL from environment or config
    const connectionString = 
      process.env.DATABASE_URL || 
      configService.get<string>('DATABASE_URL') || 
      configService.get<string>('database.url') || 
      '';

    const pool = new Pool({ 
      connectionString,
      // Add connection timeout and retry settings
      connectionTimeoutMillis: 5000,
      query_timeout: 5000,
    });
    const adapter = new PrismaPg(pool);

    super({
      adapter,
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
    });

    // Log connection info after super() call
    const logger = new Logger(PrismaService.name);
    if (!connectionString) {
      logger.error('❌ DATABASE_URL is not configured!');
      logger.error('Please set DATABASE_URL in your .env file or environment variables');
    } else {
      // Log connection string without password for debugging
      const safeUrl = connectionString.replace(/:[^:@]+@/, ':****@');
      logger.log(`🔗 Database URL: ${safeUrl}`);
    }
  }

  /**
   * Connect to database when module is initialized
   */
  async onModuleInit() {
    this.logger.log('🔌 Connecting to PostgreSQL...');
    try {
      // Connect to database
      await this.$connect();
      
      // Actually test the connection with a real query
      // This ensures we catch connection errors immediately
      await this.$queryRaw`SELECT 1 as test`;
      
      this.logger.log('✅ Connected to database successfully!');
    } catch (error) {
      this.logger.error('❌ Error connecting to database!');
      this.logger.error(`Error message: ${error.message}`);
      this.logger.error(`Error code: ${error.code || 'N/A'}`);
      
      if (error.code === 'ECONNREFUSED') {
        this.logger.error('💡 Database server is not running or not accessible');
        this.logger.error('💡 Make sure PostgreSQL is running and the connection string is correct');
      } else if (error.code === 'ENOTFOUND') {
        this.logger.error('💡 Database host not found');
      } else if (error.code === 'ETIMEDOUT') {
        this.logger.error('💡 Connection timeout - database server might be unreachable');
      } else if (error.message?.includes('password')) {
        this.logger.error('💡 Authentication failed - check your database credentials');
      }
      
      this.logger.error('Full error:', error);
      throw error;
    }
  }

  /**
   * Disconnect from database when module is destroyed
   */
  async onModuleDestroy() {
    this.logger.log('🔌 Disconnecting from database...');
    await this.$disconnect();
    this.logger.log('✅ Disconnected from database');
  }

}
