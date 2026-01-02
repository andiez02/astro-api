# GitHub Actions - Deployment

## Setup

### 1. Tạo SSH Key cho EC2

Trên EC2, tạo SSH key pair (nếu chưa có):

```bash
# Trên EC2
ssh-keygen -t rsa -b 4096 -C "github-actions" -f ~/.ssh/github_actions
```

Hoặc sử dụng existing key pair từ EC2 instance.

### 2. Lấy Private Key

```bash
# Copy private key content
cat ~/.ssh/github_actions
# hoặc
cat ~/.ssh/id_rsa
```

### 3. Cấu hình GitHub Secrets

Vào GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Thêm các secrets sau:

- **EC2_HOST**: Địa chỉ IP hoặc domain của EC2 (ví dụ: `ec2-xx-xx-xx-xx.compute-1.amazonaws.com` hoặc `54.123.45.67`)
- **EC2_USER**: Username để SSH (thường là `ubuntu` hoặc `ec2-user`)
- **EC2_KEY**: Nội dung private key (toàn bộ content của file `.pem` hoặc private key)

**Lưu ý:**

- Private key phải bao gồm cả `-----BEGIN RSA PRIVATE KEY-----` và `-----END RSA PRIVATE KEY-----`
- Không có quotes hoặc escape characters

### 4. Cấu hình EC2

Đảm bảo trên EC2:

```bash
# 1. Project directory tồn tại
# Thường là ~/astro-api hoặc ~/astro-backend

# 2. Git repository đã được clone
cd ~/astro-api
git remote -v

# 3. .env file đã được tạo
ls -la .env

# 4. Docker và docker-compose đã được cài đặt
docker --version
docker-compose --version
```

### 5. Cấu hình SSH trên EC2

Cho phép GitHub Actions SSH vào:

```bash
# Thêm public key vào authorized_keys (nếu dùng key pair mới)
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Hoặc đảm bảo existing key đã có trong `~/.ssh/authorized_keys`.

## Workflow Triggers

Workflow sẽ tự động chạy khi:

- Push code lên `main` hoặc `master` branch
- Manual trigger từ GitHub Actions tab

## Deployment Process

1. ✅ Checkout code từ GitHub
2. ✅ Setup SSH connection
3. ✅ SSH vào EC2
4. ✅ Pull latest code
5. ✅ Stop existing containers
6. ✅ Rebuild và start containers
7. ✅ Run database migrations
8. ✅ Health check

## Troubleshooting

### SSH Connection Failed

```bash
# Test SSH connection manually
ssh -i ~/.ssh/deploy_key ubuntu@your-ec2-host

# Check EC2 Security Group
# Port 22 (SSH) phải được mở cho GitHub Actions IPs
```

### Deployment Failed

```bash
# Check logs trên EC2
ssh ubuntu@your-ec2-host
cd ~/astro-api
docker-compose logs backend

# Check service status
docker-compose ps
```

### Git Pull Failed

```bash
# Đảm bảo git remote đúng
cd ~/astro-api
git remote -v
git remote set-url origin <your-repo-url>
```

## Security Best Practices

1. **SSH Key**: Sử dụng dedicated SSH key cho GitHub Actions, không dùng key chính
2. **Secrets**: Không commit secrets vào code
3. **EC2 Security Group**: Chỉ mở port 22 cho GitHub Actions IPs (hoặc dùng VPN)
4. **Key Rotation**: Rotate SSH keys định kỳ

## Manual Deployment

Nếu cần deploy manual:

```bash
# Trên EC2
cd ~/astro-api
git pull origin main
docker-compose up -d --build
docker-compose exec backend npx prisma migrate deploy
```
