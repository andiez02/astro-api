# =============================================================================
# Dockerfile - Astro NFT Marketplace Backend
# =============================================================================
# Multi-stage build for production deployment on EC2
# =============================================================================

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code and Prisma schema
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build application (fail on error)
RUN npm run build || (echo "Build failed!" && exit 1)

# Verify build output exists
RUN echo "Checking build output..." && \
    ls -la dist/ && \
    test -f dist/main.js || (echo "ERROR: dist/main.js not found!" && find dist -name "main.js" && exit 1) && \
    echo "✅ Build successful: dist/main.js exists"

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Install su-exec for switching users
RUN apk add --no-cache su-exec

# Copy Prisma files and config
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Generate Prisma Client
RUN npx prisma generate

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy migrations and config from builder
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

# Copy entrypoint script
COPY scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh
RUN chmod +x ./scripts/docker-entrypoint.sh

# Verify dist was copied correctly
RUN echo "Verifying copied files..." && \
    ls -la dist/ && \
    test -f dist/main.js || (echo "ERROR: dist/main.js not found!" && find dist -name "main.js" && exit 1) && \
    echo "✅ Copy successful: dist/main.js exists"

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /app

# Entrypoint will run migrations as root, then exec as nestjs user
ENTRYPOINT ["./scripts/docker-entrypoint.sh"]

EXPOSE 3000

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application (entrypoint will run migrations first)
CMD ["node", "dist/main.js"]

