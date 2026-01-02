#!/bin/bash

# =============================================================================
# Deployment Script for EC2
# =============================================================================

set -e

echo "=========================================="
echo "🚀 Deploying Astro NFT Marketplace Backend"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check .env file
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found!${NC}"
    echo "Please create .env file"
    exit 1
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Error: Docker is not installed!${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Error: docker-compose is not installed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Stop existing containers
echo -e "${YELLOW}📦 Stopping existing containers...${NC}"
docker-compose down || true

# Build and start
echo -e "${YELLOW}🔨 Building and starting containers...${NC}"
docker-compose up -d --build

# Wait for service
echo -e "${YELLOW}⏳ Waiting for service to be ready...${NC}"
sleep 10

# Run migrations
echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
# Wait a bit more for container to be fully ready
sleep 5
docker-compose exec -T backend npx prisma migrate deploy || {
    echo -e "${YELLOW}⚠️  Migration might have already been applied or container not ready${NC}"
    echo -e "${YELLOW}   Migrations will also run automatically on container start${NC}"
}

# Check status
echo -e "${YELLOW}🔍 Checking service status...${NC}"
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Service is running!${NC}"
    echo ""
    echo "=========================================="
    echo "📊 Service Status:"
    echo "=========================================="
    docker-compose ps
    echo ""
    echo "=========================================="
    echo "🌐 Application URLs:"
    echo "=========================================="
    PORT=${PORT:-3000}
    echo "Backend API: http://localhost:${PORT}/api/v1"
    echo "Health Check: http://localhost:${PORT}/api/v1/health"
    echo ""
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
else
    echo -e "${RED}❌ Error: Service failed to start!${NC}"
    echo "Check logs: docker-compose logs backend"
    exit 1
fi

