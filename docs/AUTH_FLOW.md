# 📚 Tài Liệu Luồng Xác Thực (Authentication Flow)

## 🎯 Tổng Quan

Hệ thống sử dụng **SIWE (Sign-In with Ethereum)** để xác thực người dùng thông qua ví Ethereum (MetaMask, WalletConnect, v.v.). Sau khi xác thực thành công, hệ thống cấp **JWT token** để bảo vệ các API endpoints. Frontend có thể sử dụng endpoint `/auth/verify` để kiểm tra token còn hợp lệ hay không.

---

## 🔄 Luồng Xác Thực Hoàn Chỉnh

### **Bước 1: Client Yêu Cầu Nonce**

**Endpoint:** `GET /api/auth/nonce?address=0x...`

**Mô tả:**

- Client gửi địa chỉ ví Ethereum của người dùng
- Server tạo một **nonce** (số ngẫu nhiên mã hóa) duy nhất
- Nonce được lưu vào database và gắn với địa chỉ ví
- Nếu user chưa tồn tại, hệ thống tự động tạo user mới

**Request:**

```http
GET /api/auth/nonce?address=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

**Response:**

```json
{
  "nonce": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
}
```

**Xử lý phía Server:**

1. Chuẩn hóa địa chỉ ví về chữ thường (lowercase)
2. Tạo nonce ngẫu nhiên bằng `siwe.generateNonce()`
3. Upsert user trong database:
   - Nếu user chưa tồn tại → Tạo mới với nonce
   - Nếu user đã tồn tại → Cập nhật nonce mới
4. Trả về nonce cho client

**File liên quan:**

- `src/modules/auth/auth.controller.ts` - `getNonce()`
- `src/modules/auth/auth.service.ts` - `getNonce()`
- `src/modules/users/users.service.ts` - `upsertNonce()`

---

### **Bước 2: Client Tạo và Ký SIWE Message**

**Mô tả:**

- Client sử dụng thư viện SIWE để tạo message với format chuẩn
- Message bao gồm: domain, address, statement, nonce, expiration time, v.v.
- Người dùng ký message bằng ví Ethereum (MetaMask sẽ hiển thị popup)
- Client nhận được signature từ ví

**Ví dụ SIWE Message:**

```
localhost:3000 wants you to sign in with your Ethereum account:
0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

Sign in with Ethereum to the app.

URI: http://localhost:3000
Version: 1
Chain ID: 1
Nonce: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
Issued At: 2024-01-15T10:30:00.000Z
Expiration Time: 2024-01-15T11:30:00.000Z
```

**Code mẫu phía Client (JavaScript):**

```javascript
import { SiweMessage } from 'siwe';

// 1. Lấy nonce từ server
const response = await fetch('/api/auth/nonce?address=0x...');
const { nonce } = await response.json();

// 2. Tạo SIWE message
const siweMessage = new SiweMessage({
  domain: window.location.hostname,
  address: walletAddress,
  statement: 'Sign in with Ethereum to the app.',
  uri: window.location.origin,
  version: '1',
  chainId: 1, // Ethereum Mainnet
  nonce: nonce,
  expirationTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
});

// 3. Tạo message string
const message = siweMessage.prepareMessage();

// 4. Ký message bằng ví
const signature = await signer.signMessage(message);
```

---

### **Bước 3: Client Gửi Message và Signature để Đăng Nhập**

**Endpoint:** `POST /api/auth/login`

**Mô tả:**

- Client gửi SIWE message và signature lên server
- Server xác minh chữ ký và nonce
- Nếu hợp lệ, server cấp JWT token

**Request Body:**

```json
{
  "message": "localhost:3000 wants you to sign in...",
  "signature": "0x1234567890abcdef..."
}
```

**Response (Thành công):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "walletAddress": "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
    "username": "0x742d35",
    "role": "USER",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Xử lý phía Server (Chi tiết):**

1. **Parse SIWE Message:**

   ```typescript
   const siweMessage = new SiweMessage(message);
   ```

2. **Xác minh Chữ ký:**

   ```typescript
   const { data: fields } = await siweMessage.verify({ signature });
   ```

   - Kiểm tra chữ ký có hợp lệ không
   - Kiểm tra message có bị giả mạo không
   - Kiểm tra expiration time

3. **Kiểm tra Nonce (Bảo mật chống Replay Attack):**

   ```typescript
   const user = await usersService.findByAddress(normalizedAddress);
   if (user.nonce !== fields.nonce) {
     throw new UnauthorizedException('Invalid or expired nonce');
   }
   ```

   - So sánh nonce trong message với nonce trong database
   - Đảm bảo nonce chỉ được sử dụng một lần

4. **Tạo Nonce Mới (Chống Replay Attack):**

   ```typescript
   const newNonce = generateNonce();
   await usersService.updateNonce(user.id, newNonce);
   ```

   - Tạo nonce mới ngay sau khi xác minh thành công
   - Nonce cũ không thể tái sử dụng

5. **Tạo JWT Token:**

   ```typescript
   const payload = {
     sub: user.id, // User ID
     walletAddress: user.walletAddress,
   };
   const accessToken = jwtService.sign(payload);
   ```

   - Token có thời hạn 7 ngày (configurable)
   - Chứa user ID và wallet address

6. **Trả về Token và User Info:**
   - Client lưu token để sử dụng cho các request sau

**File liên quan:**

- `src/modules/auth/auth.controller.ts` - `login()`
- `src/modules/auth/auth.service.ts` - `login()`

---

### **Bước 4: Sử dụng JWT Token cho Các Request Bảo Vệ**

**Mô tả:**

- Client gửi JWT token trong header `Authorization` cho các API cần xác thực
- Server xác minh token và lấy thông tin user

**Request với Token:**

```http
GET /api/users/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Xử lý phía Server:**

1. **JwtAuthGuard được áp dụng:**

   ```typescript
   @UseGuards(JwtAuthGuard)
   @Get('me')
   async getMe(@Request() req) {
     return req.user; // User đã được inject bởi JwtStrategy
   }
   ```

2. **JwtStrategy xác minh Token:**
   - Extract token từ header `Authorization: Bearer <token>`
   - Verify signature và expiration
   - Decode payload để lấy `sub` (user ID)

3. **Validate User:**

   ```typescript
   async validate(payload: JwtPayload) {
     const user = await prisma.user.findUnique({
       where: { id: payload.sub },
     });
     if (!user) {
       throw new UnauthorizedException('User not found');
     }
     return user; // Attach vào req.user
   }
   ```

4. **Controller nhận User:**
   - `req.user` chứa thông tin user đã xác thực
   - Có thể sử dụng để kiểm tra quyền, lấy dữ liệu, v.v.

**File liên quan:**

- `src/modules/auth/guards/jwt-auth.guard.ts`
- `src/modules/auth/strategies/jwt.strategy.ts`

---

### **Bước 5: Verify JWT Token (Optional)**

**Endpoint:** `GET /api/auth/verify`

**Mô tả:**

- Frontend có thể gọi endpoint này để kiểm tra JWT token còn hợp lệ hay không
- Hữu ích khi app khởi động lại hoặc cần refresh authentication state
- Token được gửi trong header `Authorization: Bearer <token>`
- Nếu token hợp lệ, server trả về `{ valid: true }`
- Nếu token không hợp lệ hoặc hết hạn, server trả về `401 Unauthorized`

**Request với Token:**

```http
GET /api/auth/verify
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (Thành công - 200 OK):**

```json
{
  "success": true,
  "data": {
    "valid": true
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Response (Lỗi - 401 Unauthorized):**

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Token has expired. Please login again."
}
```

**Xử lý phía Server:**

1. **JwtAuthGuard được áp dụng:**

   ```typescript
   @Get('verify')
   @UseGuards(JwtAuthGuard)
   async verifyToken(): Promise<{ valid: boolean }> {
     // Nếu đến đây, token đã được verify thành công
     return { valid: true };
   }
   ```

2. **JwtStrategy tự động verify:**
   - Extract token từ header `Authorization: Bearer <token>`
   - Verify signature của JWT
   - Verify expiration time (`exp`)
   - Verify user tồn tại trong database

3. **Error Handling:**
   - Token expired → `"Token has expired. Please login again."`
   - Invalid token → `"Invalid token. Please login again."`
   - Missing token → `"Authentication required. Please login."`

**Code mẫu phía Client (JavaScript):**

```javascript
// Verify token khi app khởi động
async function verifyToken() {
  const token = localStorage.getItem('accessToken');
  if (!token) return false;

  try {
    const response = await fetch('/api/auth/verify', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.data?.valid === true;
    }

    // Token không hợp lệ
    localStorage.removeItem('accessToken');
    return false;
  } catch (error) {
    console.error('Token verification failed:', error);
    return false;
  }
}
```

**Use Cases:**

- Kiểm tra token khi app reload/refresh
- Validate token trước khi gọi các API quan trọng
- Auto-logout nếu token đã hết hạn
- Refresh authentication state trong app

**File liên quan:**

- `src/modules/auth/auth.controller.ts` - `verifyToken()`
- `src/modules/auth/guards/jwt-auth.guard.ts`
- `src/modules/auth/strategies/jwt.strategy.ts`

---

## 🔒 Cơ Chế Bảo Mật

### **1. Nonce Verification (Chống Replay Attack)**

- Mỗi nonce chỉ được sử dụng **một lần**
- Sau khi login thành công, nonce cũ bị vô hiệu hóa
- Nonce mới được tạo ngay lập tức

### **2. Cryptographic Signature Verification**

- Sử dụng thư viện SIWE để xác minh chữ ký
- Đảm bảo message không bị giả mạo
- Kiểm tra expiration time

### **3. JWT Token Security**

- Token được ký bằng `JWT_SECRET` (environment variable)
- Token có thời hạn (7 ngày)
- Token được validate ở mỗi request

### **4. Address Normalization**

- Tất cả địa chỉ ví được chuẩn hóa về lowercase
- Tránh trường hợp nhầm lẫn do case sensitivity

---

## 📋 API Endpoints

### **1. GET /api/auth/nonce**

Lấy nonce cho SIWE authentication.

**Query Parameters:**

- `address` (required): Địa chỉ ví Ethereum

**Response:**

```json
{
  "nonce": "string"
}
```

**Error Responses:**

- `400 Bad Request`: Thiếu địa chỉ ví

---

### **2. POST /api/auth/login**

Đăng nhập bằng SIWE signature.

**Request Body:**

```json
{
  "message": "string", // SIWE message string
  "signature": "string" // Signature từ ví
}
```

**Response (200 OK):**

```json
{
  "accessToken": "string",
  "user": {
    "id": "string",
    "walletAddress": "string",
    "username": "string | null",
    "role": "string",
    "createdAt": "ISO 8601 date"
  }
}
```

**Error Responses:**

- `400 Bad Request`: Thiếu message hoặc signature
- `401 Unauthorized`:
  - User không tồn tại
  - Nonce không hợp lệ hoặc đã hết hạn
  - Signature verification failed

---

### **3. GET /api/auth/verify**

Verify JWT token validity.

**Authentication:**

- **Required:** Yes
- **Header:** `Authorization: Bearer <accessToken>`

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "valid": true
  },
  "timestamp": "ISO 8601 date"
}
```

**Error Responses:**

- `401 Unauthorized`:
  - Token không tồn tại hoặc format sai → `"Authentication required. Please login."`
  - Token đã hết hạn → `"Token has expired. Please login again."`
  - Token không hợp lệ → `"Invalid token. Please login again."`
  - User không tồn tại → `"User not found or session expired"`

**Use Cases:**

- Frontend kiểm tra token khi app khởi động
- Validate token trước khi thực hiện các action quan trọng
- Auto-logout nếu token đã hết hạn
- Refresh authentication state

---

## 🏗️ Cấu Trúc Code

```
src/modules/auth/
├── auth.controller.ts      # API endpoints
├── auth.service.ts         # Business logic (nonce, login)
├── auth.module.ts         # Module configuration
├── dto/
│   └── auth.dto.ts        # DTOs và interfaces
├── guards/
│   └── jwt-auth.guard.ts  # Guard để bảo vệ routes
└── strategies/
    └── jwt.strategy.ts    # Passport JWT strategy
```

**Dependencies:**

- `@nestjs/jwt` - JWT token generation
- `@nestjs/passport` - Authentication framework
- `passport-jwt` - JWT strategy cho Passport
- `siwe` - Sign-In with Ethereum library

---

## 🔧 Configuration

### **Environment Variables:**

```env
JWT_SECRET=your-secret-key-here  # Bắt buộc, dùng để ký JWT token
```

### **JWT Configuration:**

- **Expiration:** 7 ngày (configurable trong `auth.module.ts`)
- **Algorithm:** HS256 (default)
- **Token Location:** `Authorization: Bearer <token>` header

---

## 📝 Ví Dụ Sử Dụng

### **Bảo vệ Route trong Controller:**

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Request() req) {
    // req.user chứa thông tin user đã xác thực
    return req.user;
  }
}
```

### **Lấy User từ Request:**

```typescript
@UseGuards(JwtAuthGuard)
@Post('profile')
async updateProfile(
  @Request() req,
  @Body() dto: UpdateUserDto,
) {
  const userId = req.user.id; // User ID từ JWT payload
  return this.usersService.updateProfile(userId, dto);
}
```

### **Verify Token từ Frontend:**

```typescript
// Service method để verify token
async verifyToken(): Promise<boolean> {
  const token = this.getToken();
  if (!token) return false;

  try {
    const res = await this.apiClient.get('/auth/verify');
    return res?.data?.data?.valid === true;
  } catch (error) {
    // Token không hợp lệ, xóa token
    this.removeToken();
    return false;
  }
}

// Sử dụng khi app khởi động
async initializeAuth() {
  const isValid = await this.verifyToken();
  if (!isValid) {
    // Redirect to login
    this.router.navigate(['/login']);
  }
}
```

---

## 🚨 Error Handling

### **Các Lỗi Thường Gặp:**

1. **"User not found. Please request a nonce first."**
   - Nguyên nhân: User chưa được tạo (chưa gọi `/auth/nonce`)
   - Giải pháp: Gọi `GET /auth/nonce` trước khi login

2. **"Invalid or expired nonce. Please request a new nonce."**
   - Nguyên nhân: Nonce đã được sử dụng hoặc không khớp
   - Giải pháp: Gọi lại `GET /auth/nonce` để lấy nonce mới

3. **"Signature verification failed."**
   - Nguyên nhân: Chữ ký không hợp lệ hoặc message bị thay đổi
   - Giải pháp: Kiểm tra lại quá trình ký message

4. **"Token has expired. Please login again."**
   - Nguyên nhân: JWT token đã hết hạn
   - Giải pháp: Đăng nhập lại để lấy token mới

5. **"Invalid token. Please login again."**
   - Nguyên nhân: Token không hợp lệ hoặc bị giả mạo
   - Giải pháp: Đăng nhập lại

6. **"Authentication required. Please login."**
   - Nguyên nhân: Token không được gửi trong request hoặc format sai
   - Giải pháp: Đảm bảo gửi token trong header `Authorization: Bearer <token>`

---

## 🔄 Flow Diagram

```
┌─────────┐
│ Client  │
└────┬────┘
     │
     │ 1. GET /auth/nonce?address=0x...
     ├─────────────────────────────────┐
     │                                 │
     │                                 ▼
     │                        ┌─────────────────┐
     │                        │   Auth Service  │
     │                        │  - Generate     │
     │                        │    nonce        │
     │                        │  - Upsert user  │
     │                        └────────┬────────┘
     │                                 │
     │ 2. Response: { nonce }         │
     │◄────────────────────────────────┘
     │
     │ 3. Create SIWE message với nonce
     │ 4. Sign message với wallet
     │
     │ 5. POST /auth/login
     │    { message, signature }
     ├─────────────────────────────────┐
     │                                 │
     │                                 ▼
     │                        ┌─────────────────┐
     │                        │   Auth Service  │
     │                        │  - Verify sig   │
     │                        │  - Check nonce  │
     │                        │  - Generate JWT │
     │                        │  - Update nonce │
     │                        └────────┬────────┘
     │                                 │
     │ 6. Response: { accessToken, user }
     │◄────────────────────────────────┘
     │
     │ 7. Lưu token (localStorage/cookie)
     │
     │ 8. Sử dụng token cho các request sau:
     │    GET /api/users/me
     │    Authorization: Bearer <token>
     ├─────────────────────────────────┐
     │                                 │
     │                                 ▼
     │                        ┌─────────────────┐
     │                        │  JwtAuthGuard   │
     │                        │  - Extract JWT  │
     │                        │  - Verify token │
     │                        │  - Load user    │
     │                        └────────┬────────┘
     │                                 │
     │ 9. Response: { user data }     │
     │◄────────────────────────────────┘
     │
     │ 10. (Optional) Verify token:
     │     GET /api/auth/verify
     │     Authorization: Bearer <token>
     ├─────────────────────────────────┐
     │                                 │
     │                                 ▼
     │                        ┌─────────────────┐
     │                        │  JwtAuthGuard   │
     │                        │  - Verify token │
     │                        │  - Check user   │
     │                        └────────┬────────┘
     │                                 │
     │ 11. Response: { valid: true }   │
     │◄────────────────────────────────┘
     │
```

---

## ✅ Best Practices

1. **Luôn gọi `/auth/nonce` trước khi login** - Đảm bảo nonce mới nhất
2. **Lưu token an toàn** - Sử dụng httpOnly cookie hoặc secure storage
3. **Xử lý token expiration** - Implement refresh token hoặc auto re-login
4. **Validate message expiration** - Đảm bảo SIWE message không quá cũ
5. **Verify token khi app khởi động** - Sử dụng `/auth/verify` để kiểm tra token còn hợp lệ
6. **Error handling** - Hiển thị thông báo lỗi rõ ràng cho người dùng
7. **Auto-logout khi token hết hạn** - Tự động đăng xuất và redirect về login page

---

## 📚 Tài Liệu Tham Khảo

- [SIWE Specification](https://eips.ethereum.org/EIPS/eip-4361)
- [NestJS Authentication](https://docs.nestjs.com/security/authentication)
- [Passport JWT Strategy](http://www.passportjs.org/packages/passport-jwt/)

---

**Tài liệu được tạo:** 2024-01-15  
**Cập nhật lần cuối:** 2024-01-15  
**Phiên bản:** 1.1.0

---

## 📝 Changelog

### Version 1.1.0 (2024-01-15)

- ✅ Thêm endpoint `GET /auth/verify` để verify JWT token
- ✅ Cập nhật flow diagram với bước verify token
- ✅ Thêm ví dụ code cho frontend verify token
- ✅ Cập nhật best practices với token verification

### Version 1.0.0 (2024-01-15)

- ✅ Tài liệu ban đầu với SIWE authentication flow
- ✅ JWT token authentication
- ✅ API endpoints documentation
