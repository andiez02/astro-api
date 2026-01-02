#!/bin/bash

# =============================================================================
# Deployment Script for EC2
# =============================================================================
# Script để deploy ứng dụng lên EC2
# Note: Database chạy ở nơi khác (RDS, external server, etc.)
# 
# Usage:
#   chmod +x scripts/deploy.sh
#   ./scripts/deploy.sh
# =============================================================================

set -e  # Exit on error

echo "=========================================="
echo "🚀 Deploying Astro NFT Marketplace Backend"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found!${NC}"
    echo "Please create .env file from .env.example"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Error: Docker is not installed!${NC}"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Error: docker-compose is not installed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Note about external database
echo -e "${YELLOW}ℹ️  Note: Database should be running externally (RDS, external server, etc.)${NC}"
echo -e "${YELLOW}   Make sure DATABASE_URL or DATABASE_HOST is configured correctly in .env${NC}"
echo ""

# Stop existing containers
echo -e "${YELLOW}📦 Stopping existing containers...${NC}"
docker-compose down || true

# Pull latest code (if using git)
# git pull origin main

# Build and start containers
echo -e "${YELLOW}🔨 Building and starting containers...${NC}"
docker-compose up -d --build

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for backend to be ready...${NC}"
sleep 10

# Run database migrations
echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
docker-compose exec -T backend npm run prisma:migrate:prod || {
    echo -e "${YELLOW}⚠️  Migration might have already been applied or database connection failed${NC}"
    echo -e "${YELLOW}   Please check DATABASE_URL in .env file${NC}"
}

# Check if services are running
echo -e "${YELLOW}🔍 Checking service health...${NC}"
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Backend service is running!${NC}"
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
    echo -e "${RED}❌ Error: Backend service failed to start!${NC}"
    echo "Check logs with: docker-compose logs backend"
    exit 1
fi

