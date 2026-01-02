#!/bin/sh

# =============================================================================
# Docker Entrypoint Script
# =============================================================================
# Script chạy khi container start
# Optional: Có thể thêm logic chạy migrations ở đây nếu cần
# Hiện tại chỉ start application
# =============================================================================

set -e

echo "=========================================="
echo "🚀 Starting Astro NFT Marketplace Backend"
echo "=========================================="

# Optional: Wait for database and run migrations
# Uncomment below if you want auto-migration on container start
# 
# echo "⏳ Waiting for database to be ready..."
# MAX_RETRIES=30
# RETRY_COUNT=0
# while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
#   if npx prisma db execute --stdin <<< "SELECT 1" > /dev/null 2>&1; then
#     echo "✅ Database is ready!"
#     break
#   fi
#   RETRY_COUNT=$((RETRY_COUNT + 1))
#   echo "Database is unavailable - sleeping (attempt $RETRY_COUNT/$MAX_RETRIES)"
#   sleep 2
# done
# 
# echo "🗄️  Running database migrations..."
# npx prisma migrate deploy || echo "⚠️  Migration might have already been applied"

echo "✅ Starting application..."
echo "=========================================="

# Start the application
exec "$@"

