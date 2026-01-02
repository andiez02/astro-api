#!/bin/sh

# =============================================================================
# Docker Entrypoint Script
# =============================================================================
# Runs database migrations before starting the application
# =============================================================================

set -e

echo "=========================================="
echo "🚀 Starting Astro NFT Marketplace Backend"
echo "=========================================="

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  WARNING: DATABASE_URL is not set!"
  echo "⚠️  Skipping migrations. Please set DATABASE_URL in .env file"
else
  # Log DATABASE_URL without password for debugging
  DB_URL_MASKED=$(echo "$DATABASE_URL" | sed 's/:[^:@]*@/:***@/')
  echo "✅ DATABASE_URL is set: $DB_URL_MASKED"
  
  # Run Prisma migrations (will retry if database is not ready)
  echo "🗄️  Running database migrations..."
  MAX_RETRIES=10
  RETRY_COUNT=0
  
  while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if npx prisma migrate deploy; then
      echo "✅ Migrations completed successfully!"
      break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
      echo "⚠️  Migration failed, retrying in 3 seconds (attempt $RETRY_COUNT/$MAX_RETRIES)..."
      sleep 3
    else
      echo "⚠️  Migration failed after $MAX_RETRIES attempts, continuing anyway..."
      echo "⚠️  You may need to run migrations manually: docker-compose exec backend npx prisma migrate deploy"
    fi
  done
fi

echo "✅ Setup completed!"
echo "=========================================="

# Switch to non-root user and start the application
exec su-exec nestjs:nodejs "$@"

