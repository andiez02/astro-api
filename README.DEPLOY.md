# 🚀 Deployment Guide - EC2

Hướng dẫn deploy Astro NFT Marketplace Backend lên EC2.

## 📋 Prerequisites

- EC2 instance (Ubuntu/Debian)
- Docker và Docker Compose đã cài đặt
- Port 3000 đã mở trong Security Group
- Database external (RDS hoặc server khác)

## 🔧 Setup trên EC2

### 1. Cài đặt Docker

```bash
# Update system
sudo apt-get update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
# Logout và login lại
```

### 2. Clone Repository

```bash
git clone <your-repo-url> astro-backend
cd astro-backend
```

### 3. Cấu hình Environment

```bash
# Copy example file
cp .env.example .env

# Edit với các giá trị production
nano .env
```

**Các biến quan trọng:**

```env
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://your-frontend-domain.com
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your-secret-key-min-32-chars
```

### 4. Deploy

```bash
# Make script executable
chmod +x scripts/deploy.sh

# Deploy
./scripts/deploy.sh
```

**Hoặc manual:**

```bash
# Build and start
docker-compose up -d --build

# Run migrations
docker-compose exec backend npm run prisma:migrate:prod

# Check status
docker-compose ps
```

## 🔍 Verify

```bash
# Check logs
docker-compose logs -f backend

# Check health
curl http://localhost:3000/api/v1/health

# Check status
docker-compose ps
```

## 🔄 Update

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose up -d --build

# Run migrations if needed
docker-compose exec backend npm run prisma:migrate:prod
```

## 🛠️ Useful Commands

```bash
# View logs
docker-compose logs -f backend

# Stop
docker-compose down

# Restart
docker-compose restart backend

# Access container shell
docker-compose exec backend sh

# Run Prisma Studio
docker-compose exec backend npx prisma studio
```

## 🔒 Security

1. **Change Default Values:**
   - Đổi `JWT_SECRET` thành secret mạnh (min 32 chars)
   - Đổi `DATABASE_PASSWORD` thành password mạnh

2. **Firewall:**
   - Chỉ mở port 3000 cho frontend domain
   - Không expose database port ra ngoài

3. **SSL/TLS:**
   - Sử dụng Nginx reverse proxy với SSL
   - Hoặc AWS ALB với SSL certificate

## 🐛 Troubleshooting

### Container không start

```bash
# Check logs
docker-compose logs backend

# Check status
docker-compose ps
```

### Database connection issues

```bash
# Test connection
docker-compose exec backend node -e "console.log(process.env.DATABASE_URL)"

# Check database is accessible
ping your-database-host
```

### Port already in use

```bash
# Check what's using port
sudo lsof -i :3000

# Change PORT in .env
```

## 📝 Notes

- Database chạy external (RDS, etc.)
- Backup database thường xuyên
- Monitor logs và resource usage
- Setup log rotation nếu cần
