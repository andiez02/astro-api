#!/bin/bash

# =============================================================================
# Deployment Script for EC2
# =============================================================================
# Script để deploy ứng dụng lên EC2
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

# Stop existing containers
echo -e "${YELLOW}📦 Stopping existing containers...${NC}"
docker-compose -f docker-compose.prod.yml down || true

# Pull latest code (if using git)
# git pull origin main

# Build and start containers
echo -e "${YELLOW}🔨 Building and starting containers...${NC}"
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"
sleep 10

# Run database migrations
echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
docker-compose -f docker-compose.prod.yml exec -T backend npm run prisma:migrate:prod || {
    echo -e "${YELLOW}⚠️  Migration might have already been applied${NC}"
}

# Check if services are running
echo -e "${YELLOW}🔍 Checking service health...${NC}"
if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Services are running!${NC}"
    echo ""
    echo "=========================================="
    echo "📊 Service Status:"
    echo "=========================================="
    docker-compose -f docker-compose.prod.yml ps
    echo ""
    echo "=========================================="
    echo "🌐 Application URLs:"
    echo "=========================================="
    echo "Backend API: http://localhost:${PORT:-3000}/api/v1"
    echo "Health Check: http://localhost:${PORT:-3000}/api/v1/health"
    echo ""
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
else
    echo -e "${RED}❌ Error: Services failed to start!${NC}"
    echo "Check logs with: docker-compose -f docker-compose.prod.yml logs"
    exit 1
fi

