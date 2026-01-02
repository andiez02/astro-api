# 🚀 Deployment Guide - EC2

Hướng dẫn deploy Astro NFT Marketplace Backend lên EC2 sử dụng Docker.

## 📋 Prerequisites

- EC2 instance với Ubuntu/Debian
- Docker và Docker Compose đã được cài đặt
- Port 3000 (hoặc port bạn chọn) đã được mở trong Security Group
- PostgreSQL port (5432) đã được mở nếu database ở ngoài

## 🔧 Setup trên EC2

### 1. Cài đặt Docker và Docker Compose

```bash
# Update system
sudo apt-get update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group (optional, để không cần sudo)
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout và login lại để apply docker group
```

### 2. Clone Repository

```bash
# Clone your repository
git clone <your-repo-url> astro-backend
cd astro-backend
```

### 3. Cấu hình Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit .env file với các giá trị production
nano .env
```

**Các biến môi trường quan trọng:**

```env
# Application
NODE_ENV=production
PORT=3000
API_PREFIX=api/v1
CORS_ORIGIN=https://your-frontend-domain.com
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://user:password@postgres:5432/astro_db?schema=public
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=astro_db
DATABASE_USER=astro_postgres
DATABASE_PASSWORD=your-secure-password-here

# JWT Secret (QUAN TRỌNG: Đổi thành secret mạnh!)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
```

### 4. Deploy Application

**Option 1: Sử dụng deploy script (Recommended)**

```bash
# Make script executable
chmod +x scripts/deploy.sh

# Run deployment
./scripts/deploy.sh
```

**Option 2: Manual deployment**

```bash
# Build and start containers
docker-compose -f docker-compose.prod.yml up -d --build

# Run database migrations
docker-compose -f docker-compose.prod.yml exec backend npm run prisma:migrate:prod

# Check status
docker-compose -f docker-compose.prod.yml ps
```

## 🔍 Verify Deployment

### Check Service Status

```bash
# Check running containers
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Check health endpoint
curl http://localhost:3000/api/v1/health
```

### Test API Endpoints

```bash
# Health check
curl http://localhost:3000/api/v1/health

# Get nonce (example)
curl "http://localhost:3000/api/v1/auth/nonce?address=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
```

## 🔄 Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build

# Run migrations if needed
docker-compose -f docker-compose.prod.yml exec backend npm run prisma:migrate:prod
```

## 🛠️ Useful Commands

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Backend only
docker-compose -f docker-compose.prod.yml logs -f backend

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100 backend
```

### Stop Services

```bash
# Stop containers
docker-compose -f docker-compose.prod.yml stop

# Stop and remove containers
docker-compose -f docker-compose.prod.yml down

# Stop and remove containers + volumes (⚠️ WARNING: Deletes data!)
docker-compose -f docker-compose.prod.yml down -v
```

### Database Operations

```bash
# Access database shell
docker-compose -f docker-compose.prod.yml exec postgres psql -U astro_postgres -d astro_db

# Run Prisma Studio (development tool)
docker-compose -f docker-compose.prod.yml exec backend npx prisma studio

# Run migrations
docker-compose -f docker-compose.prod.yml exec backend npm run prisma:migrate:prod
```

### Container Management

```bash
# Restart backend
docker-compose -f docker-compose.prod.yml restart backend

# Rebuild without cache
docker-compose -f docker-compose.prod.yml build --no-cache

# Remove unused images
docker image prune -a
```

## 🔒 Security Best Practices

1. **Change Default Passwords:**
   - Đổi `DATABASE_PASSWORD` thành password mạnh
   - Đổi `JWT_SECRET` thành secret mạnh (ít nhất 32 ký tự)

2. **Firewall Configuration:**
   - Chỉ mở port 3000 cho frontend domain
   - Không expose PostgreSQL port (5432) ra ngoài nếu không cần

3. **SSL/TLS:**
   - Sử dụng Nginx reverse proxy với SSL certificate
   - Hoặc sử dụng AWS Application Load Balancer với SSL

4. **Environment Variables:**
   - Không commit `.env` file vào git
   - Sử dụng AWS Secrets Manager hoặc Parameter Store cho production

5. **Regular Updates:**
   - Update Docker images thường xuyên
   - Update dependencies và security patches

## 🌐 Nginx Reverse Proxy (Optional)

Nếu muốn sử dụng Nginx làm reverse proxy:

```nginx
# /etc/nginx/sites-available/astro-backend
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📊 Monitoring

### Health Check

```bash
# Manual health check
curl http://localhost:3000/api/v1/health

# Setup cron job for monitoring
# Add to crontab: */5 * * * * curl -f http://localhost:3000/api/v1/health || echo "Backend is down" | mail -s "Alert" admin@example.com
```

### Resource Usage

```bash
# Check container resource usage
docker stats

# Check disk usage
df -h
docker system df
```

## 🐛 Troubleshooting

### Container không start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs backend

# Check container status
docker-compose -f docker-compose.prod.yml ps
```

### Database connection issues

```bash
# Check database is running
docker-compose -f docker-compose.prod.yml ps postgres

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres

# Test connection
docker-compose -f docker-compose.prod.yml exec backend node -e "console.log(process.env.DATABASE_URL)"
```

### Port already in use

```bash
# Check what's using the port
sudo lsof -i :3000

# Kill process or change PORT in .env
```

## 📝 Notes

- Database data được persist trong Docker volume `postgres_data`
- Backup database thường xuyên
- Monitor disk space
- Setup log rotation nếu cần
- Consider using process manager như PM2 nếu không dùng Docker

## 🆘 Support

Nếu gặp vấn đề, check:
1. Docker logs: `docker-compose -f docker-compose.prod.yml logs`
2. Container status: `docker-compose -f docker-compose.prod.yml ps`
3. Environment variables: `cat .env`
4. Health endpoint: `curl http://localhost:3000/api/v1/health`

