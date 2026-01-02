/**
 * =============================================================================
 * Prisma Config - Astro NFT Marketplace
 * =============================================================================
 * Configuration file for Prisma 7 migrations
 * Connection URL is defined here instead of schema.prisma
 * Loads DATABASE_URL from .env file
 * =============================================================================
 */

import { config } from 'dotenv';

config();

export default {
  datasource: {
    url: process.env.DATABASE_URL,
  },
};

