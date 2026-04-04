# 🛍️ Nền Tảng Thương Mại Điện Tử Đa Kênh (Headless E-commerce)

> **Đồ Án Chuyên Ngành — Nhóm 3C**

---

## 📖 Giới Thiệu

Dự án xây dựng một nền tảng thương mại điện tử theo kiến trúc **Headless**, tách biệt hoàn toàn giữa tầng hiển thị (Frontend) và tầng nghiệp vụ (Backend API). Hệ thống giải quyết bài toán quản lý bán hàng đa kênh cho các doanh nghiệp vừa và nhỏ, bao gồm toàn bộ vòng đời từ quản lý sản phẩm, đặt hàng, thanh toán đến vận chuyển. Đối tượng sử dụng bao gồm khách hàng mua sắm online, nhân viên bán hàng và quản trị viên hệ thống.

---

## ⚙️ Tech Stack

| Nhóm | Công nghệ |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, TailwindCSS 4, MUI (Material UI), Axios, React Toastify, Swiper |
| **Backend** | Java 17, Spring Boot 3.5, Spring Security, Spring Data JPA, MapStruct, Lombok |
| **Database** | MySQL 8 (primary), Redis (cache & session), Flyway (migration) |
| **Search** | Elasticsearch 8.10 |
| **Message Queue** | RabbitMQ 3 |
| **Infrastructure** | Docker, Docker Compose, GitHub Actions (CI/CD) |
| **API Docs** | Swagger / SpringDoc OpenAPI 3 |
| **Integrations** | VNPAY (payment), GHN – Giao Hàng Nhanh (shipping), Cloudinary (image storage) |

---

## ✅ Tính Năng Chính

### 👤 Chức Năng Khách Hàng (Customer)

- **Xác thực tài khoản**: Đăng ký, đăng nhập bằng email/password với JWT; hỗ trợ refresh token, đăng xuất an toàn và đặt lại mật khẩu qua email (token hết hạn sau 15 phút).
- **Quản lý hồ sơ**: Cập nhật thông tin cá nhân, quản lý sổ địa chỉ giao hàng (thêm/sửa/xóa, đặt địa chỉ mặc định).
- **Duyệt sản phẩm**: Xem danh sách sản phẩm theo danh mục, thương hiệu; lọc theo khoảng giá; tìm kiếm full-text và fuzzy search; phân trang.
- **Chi tiết sản phẩm**: Xem ảnh, mô tả, chọn biến thể (màu sắc, kích cỡ), kiểm tra tồn kho theo SKU.
- **Giỏ hàng**: Thêm/sửa/xóa sản phẩm theo biến thể; giỏ hàng tồn tại cho user đã đăng nhập.
- **Thanh toán**: Checkout 3 bước (địa chỉ → phí ship → thanh toán); hỗ trợ **VNPay** (redirect gateway) và **COD** (thanh toán khi nhận hàng).
- **Theo dõi đơn hàng**: Xem lịch sử và trạng thái đơn hàng theo thời gian thực.
- **Thông báo email**: Nhận email xác nhận đơn hàng tự động qua HTML template.

### 🛠️ Chức Năng Quản Trị (Admin / Staff)

- **Quản lý danh mục & thương hiệu**: CRUD đầy đủ, upload logo thương hiệu.
- **Quản lý sản phẩm**: Tạo/sửa/xóa sản phẩm, upload ảnh lên Cloudinary, quản lý đa biến thể (multi-variant SKU) với hệ thống thuộc tính động (màu sắc, kích cỡ, ...).
- **Quản lý SKU**: Tự động sinh mã SKU, cấu hình giá và tồn kho theo từng biến thể; xóa mềm (soft delete) biến thể khi tồn kho = 0.
- **Quản lý đơn hàng**: Xem danh sách, lọc, xem chi tiết đơn hàng; duyệt đơn và tạo vận đơn GHN; quản lý trạng thái theo state machine.
- **Upload ảnh**: Tích hợp Cloudinary, hỗ trợ upload ảnh sản phẩm trực tiếp từ Admin UI.

### ⚙️ Tính Năng Hệ Thống

- **Phân quyền RBAC**: 4 role: `SUPER_ADMIN`, `ADMIN`, `STAFF`, `CUSTOMER`; kiểm soát truy cập API theo từng role.
- **Tìm kiếm Elasticsearch**: Full-text search và fuzzy search (tự động bù sai chính tả); kết hợp với JPA Specification để lọc đa điều kiện.
- **Caching Redis**: Cache danh sách sản phẩm (TTL 60 phút); tự động invalidate khi có thay đổi dữ liệu.
- **Async Messaging (RabbitMQ)**: Gửi email xác nhận đơn hàng bất đồng bộ qua message queue, có cơ chế retry tự động (3 lần).
- **GHN Integration**: Tính phí vận chuyển real-time, tự động tạo vận đơn sau khi xác nhận đơn, nhận cập nhật trạng thái giao hàng qua Webhook.
- **Database Migration**: Flyway quản lý lịch sử thay đổi schema tự động.
- **API Documentation**: Swagger UI tích hợp, hỗ trợ xác thực Bearer JWT.

---

## 🗂️ Kiến Trúc Dự Án

### Frontend (Next.js App Router)

```
src/
├── app/
│   ├── (admin)/        # Admin portal (dashboard, products, orders, brands, categories)
│   ├── (shop)/         # Customer storefront (home, products, cart, checkout, profile)
│   ├── login/          # Authentication pages
│   └── payment-result/ # Payment callback page
├── components/
│   ├── admin/          # Admin-specific UI components
│   ├── shop/           # Storefront components (Header, Footer, ProductCard, ...)
│   └── common/         # Shared components (Toast, ...)
├── context/            # React Context (AuthContext, AdminAuthContext, CartContext)
├── services/           # API service layer (axios wrappers theo từng domain)
└── lib/                # Axios instance configuration
```

Frontend theo mô hình **App Router** của Next.js, phân chia rõ ràng giữa khu vực Admin `(admin)` và Storefront `(shop)`. Mỗi domain nghiệp vụ có service riêng (`productService`, `orderService`, `authService`, ...) để gọi API.

### Backend (Spring Boot — Layered Architecture)

```
src/main/java/com/example/clothingstore/
├── config/         # Cấu hình: Security, Redis, RabbitMQ, CORS, VNPay, GHN, Cloudinary
├── controller/     # REST API Controllers (AuthN, Product, Order, Payment, Shipping, ...)
├── service/        # Business logic (impl/, cloudinary/, mail/, rabbitmq/)
├── repository/     # Spring Data JPA Repositories + Elasticsearch Repository
├── entity/         # JPA Entities (Product, Sku, Order, User, Address, ...)
├── dto/            # Request/Response DTOs
├── mapper/         # MapStruct mappers (Entity ↔ DTO)
├── exception/      # Global Exception Handler, ErrorCode enum
└── document/       # Elasticsearch Document (ProductDocument)
```

Backend theo kiến trúc **monolith phân lớp** (Controller → Service → Repository). Security được xử lý bởi Spring Security + custom JWT decoder, kiểm soát từng endpoint theo role.

---

## 🔄 Luồng Xử Lý Nghiệp Vụ Chính

### 💳 Thanh Toán VNPay

```
Khách hàng                 Backend                         VNPay Gateway
     │                        │                                  │
     │─── POST /orders ───────►│                                  │
     │                        │── Tạo Order (status: PENDING) ──►│
     │◄─── Order ID ──────────│                                  │
     │                        │                                  │
     │─── GET /payment/create-payment?orderId=X ──────────────────►│
     │                        │── Build VNPay URL + HMAC SHA512 ──│
     │◄─── Payment URL ───────│                                  │
     │                        │                                  │
     │──────────────────────── Redirect to VNPay ───────────────►│
     │                        │                            Xử lý thanh toán
     │◄─────────────────────── Callback (vnp_ResponseCode) ──────│
     │                        │                                  │
     │─── GET /payment/vn-pay-callback ──────────────────────────►│
     │                        │── Verify HMAC checksum ──────────│
     │                        │── Update Order: CONFIRMED ────────│
     │                        │── RabbitMQ: gửi email ───────────│
```

**Chi tiết:**
1. Khách hàng tạo đơn hàng → Backend lưu Order với trạng thái `PENDING`.
2. Frontend gọi API tạo payment URL → Backend tạo request VNPay có ký HMAC SHA512.
3. Khách hàng được redirect sang cổng VNPay để nhập thông tin thanh toán.
4. VNPay redirect về `GET /payment/vn-pay-callback` với kết quả giao dịch.
5. Backend verify checksum → nếu hợp lệ và `vnp_ResponseCode = 00`, cập nhật Order thành `CONFIRMED`.
6. Bắn message vào RabbitMQ → OrderConsumer gửi email xác nhận cho khách.

---

### 🚚 Luồng Vận Chuyển GHN

```
Admin                      Backend                          GHN API
  │                            │                               │
  │── POST /orders/{id}/ship ──►│                               │
  │                            │── Lấy thông tin Order ────────│
  │                            │── Build GHN Request ──────────│
  │                            │─── POST create-order ────────►│
  │                            │◄── tracking_code (mã vận đơn) │
  │                            │── Lưu tracking_code vào Order ─│
  │                            │── Update status: SHIPPING ─────│
  │◄── Order updated ──────────│                               │
  │                            │                               │
  │              (Async) Webhook GHN ──────────────────────────►│
  │                            │◄── POST /api/webhook/ghn ──────│
  │                            │── Parse status (delivered/cancel/return)
  │                            │── Update Order status tương ứng
```

**Chi tiết:**
1. Admin duyệt đơn qua `POST /orders/{id}/ship`.
2. Backend gọi GHN API để tạo vận đơn, truyền thông tin người nhận, địa chỉ, danh sách sản phẩm, và loại dịch vụ.
3. GHN trả về `order_code` (mã vận đơn) → Backend lưu vào field `trackingCode` và chuyển trạng thái đơn sang `SHIPPING`.
4. Khi có cập nhật trạng thái giao hàng (giao thành công, hủy, ...), GHN gửi Webhook về `POST /api/webhook/ghn`.
5. Backend parse payload và cập nhật trạng thái Order: `COMPLETED`, `CANCELLED`.

---

## 🚀 Hướng Dẫn Khởi Chạy

### Yêu Cầu Môi Trường

- Docker & Docker Compose
- Java 17+
- Node.js 18+

### 1. Khởi động Infrastructure (Docker)

```bash
docker-compose up -d
```

Lệnh này khởi động: **Redis** (port 6379), **RabbitMQ** (port 5672, Management UI: 15672), **Elasticsearch** (port 9200).

### 2. Cấu Hình Backend

Tạo file `backend/src/main/resources/application-secret.yaml` với nội dung:

```yaml
spring:
  mail:
    host: 
    username: 
    password: 
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true

jwt:
  signerKey: 
  valid-duration: 
  refreshable-duration: 
cloudinary:
  cloud-name:
  api-key:
  api-secret:
payment:
  vnpay:
    tmn-code: 
    secret-key: 
shipping:
  ghn:
    shop-id: 
    api-key: 
    shop-district-id: 
```

### 3. Chạy Backend

```bash
cd backend
./mvnw spring-boot:run
```

API Base URL: `http://localhost:8080`
Swagger UI: `http://localhost:8080/swagger-ui.html`

### 4. Chạy Frontend

```bash
cd frontend
npm install
npm run dev
```

Storefront: `http://localhost:3000`
Admin Portal: `http://localhost:3000/admin`

---

## 📋 Kế Hoạch Phát Triển (Sprint Plan)

Dự án được phát triển theo phương pháp Agile Scrum trong **10 Sprints / 20 tuần (~5 tháng)**, tổng **341 Story Points**.

| Sprint | Nội Dung | Trạng Thái |
|--------|----------|------------|
| Sprint 1 | Core System Setup (Spring Boot, MySQL, Next.js, CI/CD, Docker) | ✅ Done |
| Sprint 2 | Authentication & User Management (JWT, RBAC, Address) | ✅ Done |
| Sprint 3 | Product Management (Category, Brand, SKU, Search & Filter) | ✅ Done |
| Sprint 4 | Inventory Management (GRN, QC, Stock Tracking) | ✅ Done |
| Sprint 5 | Shopping Cart & Storefront (Homepage, PLP, PDP, Mobile) | ✅ Done |
| Sprint 6 | Order Management (State Machine, Order Lifecycle, Email) | ✅ Done |
| Sprint 7 | Payment Integration (VNPay, COD, Transaction Log) | ✅ Done |
| Sprint 8 | Logistics Integration (GHN, Touchless Fulfillment, Webhook) | ✅ Done |
| Sprint 9 | Admin Portal & Marketing (Dashboard, Coupon, Flash Sale) | 📋 To Do |
| Sprint 10 | Testing, Optimization & Deployment | 📋 To Do |

---

## 🗄️ Cơ Sở Dữ Liệu

Schema được quản lý tự động bởi **Flyway**. File migration: `src/main/resources/db/migration/V1__init_schema.sql`.

**Các entity chính:**

- `User`, `Role`, `Permission` — Hệ thống tài khoản và phân quyền
- `Product`, `ProductOption`, `ProductOptionValue`, `Sku`, `SkuValue` — Hệ thống sản phẩm đa biến thể
- `Category`, `Brand` — Phân loại sản phẩm
- `Order`, `OrderItem` — Quản lý đơn hàng
- `Address`, `Province`, `District`, `Ward` — Địa chỉ giao hàng (dữ liệu tỉnh/huyện/xã từ GHN)
- `InvalidatedToken` — Blacklist JWT token đã đăng xuất

---

## 🔑 API Endpoints (Tóm Tắt)

| Module | Base URL | Ghi Chú |
|--------|----------|---------|
| Authentication | `/api/v1/auth` | Public |
| Products | `/api/v1/products` | Public (GET), Auth (POST/PUT/DELETE) |
| Categories | `/api/v1/categories` | Public |
| Brands | `/api/v1/brands` | Public |
| Orders | `/api/v1/orders` | Auth required |
| Payment | `/api/v1/payment` | Auth required |
| Shipping | `/api/v1/shipping` | Auth required |
| Addresses | `/api/v1/addresses` | Auth required |
| GHN Webhook | `/api/webhook/ghn` | Internal |

Chi tiết đầy đủ tại Swagger UI: `http://localhost:8080/swagger-ui.html`
