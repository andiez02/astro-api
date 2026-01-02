# =============================================================================
# Dockerfile - Astro NFT Marketplace Backend
# =============================================================================
# Multi-stage build để tối ưu kích thước image
# Stage 1: Build - Compile TypeScript và install dependencies
# Stage 2: Production - Chỉ copy files cần thiết
# =============================================================================

# =============================================================================
# Stage 1: Build
# =============================================================================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript to JavaScript
RUN npm run build

# =============================================================================
# Stage 2: Production
# =============================================================================
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy Prisma files
COPY prisma ./prisma/

# Generate Prisma Client for production
RUN npx prisma generate

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy Prisma schema (needed for migrations)
COPY --from=builder /app/prisma ./prisma

# Copy entrypoint script
COPY scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh
RUN chmod +x ./scripts/docker-entrypoint.sh

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Change ownership of app directory
RUN chown -R nestjs:nodejs /app

# Expose port (default 3000, can be overridden by env)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Set NODE_ENV to production
ENV NODE_ENV=production

# Switch to non-root user
USER nestjs

# Use entrypoint script (optional: can add migration logic here)
ENTRYPOINT ["./scripts/docker-entrypoint.sh"]

# Start the application
CMD ["node", "dist/main.js"]

