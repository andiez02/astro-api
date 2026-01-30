import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'prisma/config';

// Load environment variables from .env so DATABASE_URL is available
loadEnv();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL environment variable is required for Prisma migrations. ' +
      'Please set it in your .env file or your shell environment.',
  );
}

export default defineConfig({
  // Explicit schema path (optional, but clearer)
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),

  // Prisma 7: datasource.url is configured here instead of in schema.prisma
  datasource: {
    url: databaseUrl,
  },
});

