# 🎨 Astro NFT Marketplace - Backend

> Backend API cho dự án **Astro NFT Marketplace** - Khóa luận tốt nghiệp

## 📋 Mục lục

- [Tổng quan](#tổng-quan)
- [Tech Stack](#tech-stack)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Hướng dẫn cài đặt](#hướng-dẫn-cài-đặt)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)

## 📖 Tổng quan

Đây là backend service cho Astro NFT Marketplace, cung cấp các API để:

- Quản lý NFT (CRUD operations)
- Health check hệ thống
- Kết nối với PostgreSQL database

## 🛠️ Tech Stack

| Technology     | Description                   |
| -------------- | ----------------------------- |
| **NestJS**     | Framework Node.js cho backend |
| **TypeScript** | Ngôn ngữ lập trình type-safe  |
| **PostgreSQL** | Database quan hệ              |
| **Prisma**     | ORM hiện đại cho Node.js      |
| **Docker**     | Container hóa database        |
| **Swagger**    | API documentation             |

## 📁 Cấu trúc thư mục

```
src/
├── main.ts                    # Entry point
├── app.module.ts              # Root module
│
├── config/                    # 🔧 Configuration module
│   ├── config.module.ts
│   ├── app.config.ts
│   └── index.ts
│
├── database/                  # 🗄️ Database module (Prisma)
│   ├── database.module.ts
│   ├── prisma.service.ts
│   └── index.ts
│
├── health/                    # ❤️ Health check module
│   ├── health.module.ts
│   ├── health.controller.ts
│   ├── health.service.ts
│   └── index.ts
│
├── nft/                       # 🖼️ NFT module
│   ├── nft.module.ts
│   ├── nft.controller.ts
│   ├── nft.service.ts
│   ├── dto/
│   │   ├── create-nft.dto.ts
│   │   ├── update-nft.dto.ts
│   │   ├── nft-query.dto.ts
│   │   ├── nft-response.dto.ts
│   │   └── index.ts
│   └── index.ts
│
└── common/                    # 🔨 Shared utilities
    ├── filters/
    │   └── http-exception.filter.ts
    ├── interceptors/
    │   ├── logging.interceptor.ts
    │   └── transform.interceptor.ts
    └── index.ts

prisma/
├── schema.prisma              # Database schema
└── seed.ts                    # Seed data
```

## 🚀 Hướng dẫn cài đặt

### Bước 1: Clone và cài đặt dependencies

```bash
# Clone repo (nếu cần)
cd krypto-backend

# Cài đặt dependencies
npm install
```

### Bước 2: Khởi động PostgreSQL với Docker

```bash
# Khởi động database
docker-compose up -d

# Kiểm tra container đang chạy
docker-compose ps
```

### Bước 3: Cấu hình môi trường

```bash
# Copy file .env.example thành .env (hoặc tạo mới)
cp .env.example .env

# Nội dung .env mặc định:
# DATABASE_URL=postgresql://krypto_user:krypto_password_2024@localhost:5432/krypto_nft_db?schema=public
```

### Bước 4: Chạy Prisma migrations

```bash
# Generate Prisma Client
npm run prisma:generate

# Chạy migrations
npm run prisma:migrate

# (Optional) Seed dữ liệu mẫu
npm run prisma:seed
```

### Bước 5: Khởi động server

```bash
# Development mode (hot reload)
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

### ✅ Kiểm tra hoạt động

```bash
# Health check
curl http://localhost:3000/api/v1/health

# Lấy danh sách NFT
curl http://localhost:3000/api/v1/nfts
```

## 📡 API Endpoints

### Health Check

| Method | Endpoint              | Description                  |
| ------ | --------------------- | ---------------------------- |
| GET    | `/api/v1/health`      | Kiểm tra trạng thái hệ thống |
| GET    | `/api/v1/health/ping` | Ping server                  |

### NFT APIs

| Method | Endpoint           | Description                       |
| ------ | ------------------ | --------------------------------- |
| GET    | `/api/v1/nfts`     | Lấy danh sách NFT (có phân trang) |
| GET    | `/api/v1/nfts/:id` | Lấy chi tiết NFT                  |
| POST   | `/api/v1/nfts`     | Tạo NFT mới                       |
| PATCH  | `/api/v1/nfts/:id` | Cập nhật NFT                      |
| DELETE | `/api/v1/nfts/:id` | Xóa NFT                           |

### Query Parameters (GET /nfts)

| Param      | Type    | Description                 |
| ---------- | ------- | --------------------------- |
| `page`     | number  | Số trang (default: 1)       |
| `limit`    | number  | Số item/trang (default: 10) |
| `isListed` | boolean | Lọc theo trạng thái bán     |
| `owner`    | string  | Lọc theo địa chỉ ví owner   |
| `creator`  | string  | Lọc theo địa chỉ ví creator |

## 🗄️ Database Schema

### NFT Table

```prisma
model Nft {
  id          String   @id @default(uuid())
  tokenId     String   @unique          // ID trên blockchain
  name        String                    // Tên NFT
  description String?                   // Mô tả
  imageUrl    String                    // URL hình ảnh
  metadataUrl String?                   // URL metadata JSON
  price       Decimal?                  // Giá (Wei)
  isListed    Boolean  @default(false)  // Đang bán?
  owner       String                    // Địa chỉ ví owner
  creator     String                    // Địa chỉ ví creator
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## 📝 Scripts

```bash
# Development
npm run start:dev      # Chạy dev server với hot reload
npm run build          # Build production

# Database
npm run prisma:generate   # Generate Prisma Client
npm run prisma:migrate    # Chạy migrations
npm run prisma:studio     # Mở Prisma Studio (GUI)
npm run prisma:seed       # Seed dữ liệu mẫu
npm run db:reset          # Reset database

# Linting & Formatting
npm run lint           # Chạy ESLint
npm run format         # Chạy Prettier
```

## 👨‍💻 Author

- **Astro Team** - Khóa luận tốt nghiệp

---

⭐ **Astro NFT Marketplace** - Graduation Thesis Project
