#!/bin/bash

# =============================================================================
# Run Database Migrations
# =============================================================================
# Run Prisma migrations on production database
# =============================================================================

set -e

echo "=========================================="
echo "🗄️  Running Database Migrations"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if running in Docker
if [ -f /.dockerenv ] || [ -n "$DOCKER_CONTAINER" ]; then
    echo "Running migrations inside container..."
    npx prisma migrate deploy
else
    # Check if container is running
    if docker-compose ps | grep -q "Up"; then
        echo "Running migrations in Docker container..."
        docker-compose exec -T backend npx prisma migrate deploy
    else
        echo -e "${RED}❌ Error: Container is not running!${NC}"
        echo "Start container first: docker-compose up -d"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Migrations completed!${NC}"

