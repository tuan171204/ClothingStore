# 🛍️ ClothingStore — Nền Tảng Thương Mại Điện Tử Đa Kênh (Headless E-commerce)

> **Đồ Án Chuyên Ngành — Nhóm 3C**
> Phiên bản: **v1.0.0 — HOÀN THÀNH** (Sprint 1–10 / 10 Sprints)

---

## 📖 Tổng Quan Dự Án

ClothingStore là nền tảng thương mại điện tử theo kiến trúc **Headless**, tách biệt hoàn toàn giữa tầng hiển thị (Frontend Next.js) và tầng nghiệp vụ (Backend Spring Boot REST API). Hệ thống giải quyết bài toán quản lý bán hàng đa kênh cho doanh nghiệp vừa và nhỏ, bao phủ toàn bộ vòng đời từ quản lý sản phẩm, đặt hàng, thanh toán, vận chuyển đến phân tích kinh doanh nâng cao.

**Đối tượng sử dụng:** Khách hàng mua sắm online · Nhân viên kho/bán hàng (Staff) · Quản trị viên (Admin / Super Admin)

---

## ⚙️ Tech Stack

| Nhóm | Công nghệ | Phiên bản |
|---|---|---|
| **Frontend** | Next.js (App Router), React, TailwindCSS, MUI, Axios, React Toastify, Swiper | Next.js 16 / React 19 |
| **Backend** | Java, Spring Boot, Spring Security, Spring Data JPA, MapStruct, Lombok | Java 17 / Spring Boot 3.4 |
| **Database** | MySQL (primary), Redis (cache & session), Flyway (migration) | MySQL 8 / Redis latest |
| **Search** | OpenSearch (fork của Elasticsearch, tích hợp qua spring-data-opensearch) | OpenSearch 1.5 |
| **Message Queue** | RabbitMQ | v3 |
| **AI / Chatbot** | Spring AI + Google Gemini (embedding & chat) + Pinecone (Vector Store) | Spring AI 1.1.4 |
| **Infrastructure** | Docker, Docker Compose, GitHub Actions (CI/CD) | — |
| **API Docs** | Swagger / SpringDoc OpenAPI 3 | 2.8.4 |
| **Integrations** | VNPay (payment gateway), GHN – Giao Hàng Nhanh (shipping), Cloudinary (image storage), Google OAuth2 | — |
| **WebSocket** | Spring WebSocket + STOMP (real-time notifications) | — |

---

## ✅ Tính Năng Đã Hoàn Thành

### 👤 Khách Hàng (Customer)

| Nhóm | Chi tiết |
|---|---|
| **Xác thực** | Đăng ký / Đăng nhập email+password (JWT), Google OAuth2, Refresh Token, Đăng xuất (blacklist token), Quên/Đặt lại mật khẩu qua email (token Redis TTL 15 phút) |
| **Hồ sơ** | Xem/cập nhật thông tin cá nhân, upload avatar (Cloudinary), Sổ địa chỉ giao hàng (CRUD, đặt mặc định) |
| **Duyệt sản phẩm** | Danh sách sản phẩm, lọc theo danh mục/thương hiệu/khoảng giá, tìm kiếm full-text & fuzzy (OpenSearch), phân trang |
| **Chi tiết sản phẩm** | Ảnh, mô tả, chọn biến thể (Màu × Size), kiểm tra tồn kho theo SKU, ma trận biến thể |
| **Giỏ hàng** | Thêm/sửa/xóa theo SKU, giỏ hàng Redis (user & guest), merge khi đăng nhập, validate & sync tồn kho, tích hợp giá Flash Sale real-time |
| **Checkout** | 3 bước (địa chỉ → phí ship → thanh toán), kiểm tra tồn kho Optimistic Lock, áp mã giảm giá, VNPay redirect, COD |
| **Đơn hàng** | Lịch sử đơn, xem chi tiết, theo dõi trạng thái vận chuyển GHN real-time, **Hủy đơn** (PENDING/CONFIRMED), **Yêu cầu hoàn trả** (COMPLETED + trong 30 ngày, kèm ảnh bằng chứng) |
| **Đánh giá** | Đánh giá sản phẩm sau khi đơn COMPLETED (verified purchase), xem đánh giá đã duyệt |
| **Bình luận** | Hỏi đáp sản phẩm (comment + reply 1 cấp) |
| **Chatbot AI** | Tư vấn sản phẩm qua RAG (Pinecone vector store + Google Gemini), streaming response, chat memory per conversation |
| **Flash Sale** | Xem chiến dịch Flash Sale đang chạy, mua hàng giá KM (kiểm soát tồn kho qua Redis atomic decrement) |

### 🛠️ Quản Trị (Admin / Staff)

| Nhóm | Chi tiết |
|---|---|
| **Danh mục & Thương hiệu** | CRUD đầy đủ, upload logo thương hiệu, phân trang |
| **Sản phẩm** | Tạo/sửa/xóa (soft delete nếu đã nhập kho), upload ảnh Cloudinary, quản lý đa biến thể (multi-variant SKU), thuộc tính động, đồng bộ vector Pinecone |
| **SKU** | Tự động sinh mã SKU, cấu hình giá & tồn kho theo biến thể, profit margin tự động tính giá bán, xóa mềm khi hết hàng |
| **Nhập kho (GRN)** | Tạo/sửa phiếu nhập, QC (quantity_passed / quantity_failed), xác nhận nhập kho → cập nhật tồn kho + tính giá nhập bình quân (WAC) |
| **Tồn kho** | Xem trạng thái per SKU, cảnh báo tồn kho thấp, điều chỉnh thủ công (audit trail), lịch sử biến động (StockMovement), báo cáo stock-on-hand & định giá |
| **Đơn hàng** | Danh sách lọc đa điều kiện (keyword/status/payment/ngày), xem chi tiết, cập nhật trạng thái, duyệt & tạo vận đơn GHN, duyệt yêu cầu hoàn trả, thống kê doanh thu |
| **Coupon** | CRUD mã giảm giá (%, số tiền cố định), giới hạn lượt dùng, thời hạn, áp dụng toàn đơn hoặc per sản phẩm |
| **Flash Sale** | CRUD chiến dịch Flash Sale (tên, thời gian, danh sách SKU + giá KM + số lượng), đồng bộ Redis khi lưu |
| **Đánh giá** | Duyệt/từ chối đánh giá, duyệt hàng loạt, lọc review pending |
| **Thông báo** | Xem thông báo Admin (đơn mới, tồn kho thấp, hoàn trả, hủy đơn), đánh dấu đã đọc |
| **Banner** | CRUD banner homepage, bật/tắt hiển thị, upload ảnh Cloudinary |
| **Quản lý người dùng** | Danh sách khách hàng & nhân viên (phân trang, filter), tạo/sửa/xóa nhân viên, bật/tắt tài khoản, gán role |
| **Báo cáo & Thống kê** | Dashboard KPIs (doanh thu hôm nay / tháng / năm, tăng trưởng %), biểu đồ doanh thu theo ngày/tuần/tháng, Top sản phẩm bán chạy, phân tích theo danh mục & thương hiệu, báo cáo khách hàng (CLV, retention), xuất CSV |
| **Vector Sync** | Đồng bộ dữ liệu sản phẩm lên Pinecone cho chatbot |

### ⚙️ Hệ Thống

| Tính năng | Mô tả |
|---|---|
| **RBAC 4 cấp** | `SUPER_ADMIN` · `ADMIN` · `STAFF` · `CUSTOMER` — kiểm soát từng endpoint |
| **JWT** | Access token (HMAC SHA256) + Refresh token, blacklist qua `InvalidatedToken` table |
| **OpenSearch** | Full-text search + fuzzy search tự động bù sai chính tả |
| **Redis Cache** | Cache danh sách sản phẩm (TTL 60 phút), cart (Redis hash), Flash Sale stock (atomic DECR), reset password token, cache đơn hàng per user |
| **RabbitMQ Async** | 3 queue: `order_email_queue` (email xác nhận/delivered/cancelled), `notification_queue` (WebSocket push), `flash_sale_sync_queue` (đồng bộ sold_quantity MySQL) |
| **Email** | Template Thymeleaf HTML cho: xác nhận đơn, giao thành công, hủy đơn |
| **WebSocket (STOMP)** | Real-time notifications cho Admin qua `/topic/admin/notifications`, xác thực JWT trên CONNECT |
| **GHN Webhook** | Nhận trạng thái giao hàng, cập nhật OrderStatus + trackingMessage, tự động xuất/hoàn kho |
| **Flyway Migration** | 9 migration files (V1–V9), quản lý schema tự động |
| **Optimistic Lock** | `@Version` trên `Inventory` cho checkout đồng thời, retry 3 lần với `@Retryable` |
| **Cloudinary** | Upload ảnh sản phẩm, avatar, ảnh bằng chứng hoàn trả |
| **Spring AI RAG** | Tư vấn sản phẩm: embed text → Pinecone, retrieve → Gemini generate, chat memory per session (JDBC) |
| **Performance Testing** | Kiểm thử tải với JMeter: checkout, Flash Sale, API danh sách sản phẩm |
| **Docker Production** | Docker Compose multi-service production-ready, CI/CD qua GitHub Actions |

---

## 🏗️ Kiến Trúc Dự Án

### Frontend — Next.js App Router

```
src/
├── app/
│   ├── (admin)/        # Admin portal: dashboard, products, orders, brands, categories, inventory, coupons, flash-sales, reports, users
│   ├── (shop)/         # Customer storefront: home, products, cart, checkout, profile, orders
│   ├── login/          # Auth pages
│   └── payment-result/ # VNPay callback page
├── components/
│   ├── admin/          # Admin-specific UI components
│   ├── shop/           # Storefront components (Header, Footer, ProductCard, ChatBot, ...)
│   └── common/         # Shared (Toast, ...)
├── context/            # React Context: AuthContext, AdminAuthContext, CartContext
├── services/           # Axios wrappers theo domain (productService, orderService, reportService, ...)
└── lib/                # Axios instance config
```

### Backend — Spring Boot Layered Architecture

```
src/main/java/com/example/clothingstore/
├── config/             # Security, Redis, RabbitMQ, CORS, VNPay, GHN, Cloudinary, WebSocket, OpenSearch, SpringAI
├── controller/         # REST Controllers (Auth, Product, Order, Payment, Shipping, Cart, Coupon, FlashSale, Report, ...)
├── service/
│   ├── impl/           # Business logic (OrderService, CheckoutService, ReportingService, ...)
│   ├── rabbitmq/       # Producers & Consumers (OrderProducer, NotificationProducer, FlashSaleConsumer, ...)
│   ├── mail/           # MailService (Thymeleaf templates)
│   ├── cloudinary/     # CloudinaryService
│   └── chatbot/        # VectorSyncService (Pinecone sync)
├── repository/
│   ├── specification/  # JPA Specification (OrderSpecification, ProductSpecification, UserSpecification)
│   ├── report/         # Native SQL projections cho reporting
│   └── search/         # ProductSearchRepository (OpenSearch)
├── entity/             # JPA Entities + Enums
├── dtos/               # Request/Response DTOs
├── mapper/             # MapStruct mappers
└── exception/          # GlobalExceptionHandler, ErrorCode, AppException
```

---

## 🔄 Luồng Nghiệp Vụ Chính

### 💳 Thanh Toán VNPay

```
[Customer] POST /orders/checkout
    → CheckoutService: validate stock (Optimistic Lock) → tạo Order PENDING → clearCart
    → [COD] autoConfirmAndShip() ngay lập tức
    → [VNPAY] trả về orderId → FE gọi GET /payment/create-payment?orderId=X
         → VnPayService build URL + HMAC SHA512 → redirect VNPay
         → VNPay callback GET /payment/vn-pay-callback → verify checksum
         → autoConfirmAndShip(orderId): PENDING → CONFIRMED → (GHN) → SHIPPING
    → RabbitMQ: gửi email xác nhận
```

### 🚚 Vận Chuyển GHN

```
autoConfirmAndShip() hoặc Admin POST /orders/{id}/ship
    → GhnService.createShippingOrder() → lưu trackingCode → status = SHIPPING
    → GHN gọi Webhook POST /api/webhook/ghn
    → GhnWebhookService: cập nhật trackingStatus + trackingMessage + OrderStatus
    → delivered → COMPLETED → deductStock() + gửi email
    → cancel/return → CANCELLED → releaseStock() + gửi email
```

### ⚡ Flash Sale

```
Admin tạo FlashSale → FlashSaleServiceImpl.create()
    → Lưu MySQL (flash_sales + flash_sale_items)
    → FlashSaleRedisService.syncFlashSaleToRedis()
         → SET flash_sale:{id}:sku:{skuId}:stock = remaining (TTL đến endTime)
         → SET flash_sale:{id}:sku:{skuId}:price = promotionalPrice
         → SET flash_sale:active_sku:{skuId} = saleId

Checkout:
    → checkAndDeductFlashSale(skuId, qty): DECR Redis stock atomically
    → Nếu stock < 0 → revert + throw OUT_OF_STOCK
    → Sau commit DB → RabbitMQ flash_sale_sync_queue → FlashSaleConsumer cập nhật soldQuantity MySQL
```

### 🤖 AI Chatbot (RAG)

```
Admin POST /admin/vector/sync → VectorSyncService
    → Load tất cả active products + SKU variants
    → Build semantic text (tên, danh mục, thương hiệu, mô tả, biến thể + giá)
    → Gemini embedding → Pinecone upsert

Customer POST /chat/stream (Server-Sent Events)
    → ChatClient (Spring AI) với RetrievalAugmentationAdvisor
    → Tìm top-3 vectors gần nhất (similarity ≥ 0.4)
    → Gemini generate + stream tokens về FE
    → Lưu chat history vào MySQL (spring_ai_chat_memory)
```

### 📊 Báo Cáo & Analytics

```
Admin Dashboard → ReportingService
    → Native SQL queries trên ReportRepository (tránh N+1, GROUP BY nhanh)
    → Cache Redis: report_daily_revenue / report_monthly_revenue / report_top_customers
    → DashboardSummaryDTO: KPIs hôm nay + biểu đồ 30 ngày + Top 5 sản phẩm
    → SalesComparisonResponse: So sánh kỳ hiện tại vs kỳ trước (% tăng trưởng)
    → Export CSV: stream thẳng ra HttpServletResponse (không tạo file tạm)
```

---

## 🗄️ Database Schema — Các Entity Chính

| Nhóm | Tables |
|---|---|
| **Auth** | `users`, `role`, `permissions`, `role_permissions`, `invalidated_token` |
| **Product** | `products`, `product_options`, `product_option_values`, `skus`, `sku_values` |
| **Catalog** | `categories`, `brands` |
| **Inventory** | `inventory` (Optimistic Lock `version`), `goods_receipts`, `goods_receipt_items`, `stock_movements`, `stock_adjustments` |
| **Order** | `orders` (cancel/return fields, tracking GHN), `order_items` |
| **Address** | `addresses`, `provinces`, `districts`, `wards` |
| **Coupon** | `coupons`, `coupon_product` |
| **Flash Sale** | `flash_sales`, `flash_sale_items` |
| **Social** | `reviews`, `product_comments` |
| **Notification** | `notifications` |
| **AI Memory** | `spring_ai_chat_memory` |
| **Customer** | `customers` (loyalty points, membership tier) |
| **Banner** | `banners` |

**Flyway Migrations:** V1 (init schema + seed data 20 SP / 22 đơn hàng) → V2 (optimistic lock inventory) → V3 (profit margin + GRN import price + coupons) → V4 (GHN tracking fields) → V5 (cancel/return order fields) → V6 (notifications) → V7 (flash sales) → V8 (coupon_code on orders) → V9 (Google OAuth + AI chat memory)

---

## 🔑 API Endpoints (Tóm Tắt)

| Module | Base URL | Auth |
|---|---|---|
| Authentication | `/api/v1/auth` | Public |
| Users | `/api/v1/users` | Public (đăng ký) / Auth (myInfo, update) |
| User Management | `/api/v1/management` | Staff+ |
| Products | `/api/v1/products` | Public (GET) / Staff+ (POST/PUT/DELETE) |
| Categories | `/api/v1/categories` | Public |
| Brands | `/api/v1/brands` | Public |
| Banners | `/api/v1/banners` | Public (GET) / Staff+ (POST/PATCH/DELETE) |
| Cart | `/api/v1/cart` | Auth (user) / Public (guest) |
| Orders | `/api/v1/orders` | Auth |
| Checkout | `/api/v1/orders/checkout` | Auth |
| Payment | `/api/v1/payment` | Auth |
| Shipping | `/api/v1/shipping` | Auth |
| Addresses | `/api/v1/addresses` | Auth |
| Coupons | `/api/v1/coupons` | Public (apply/validate) / Admin (CRUD) |
| Flash Sales | `/api/v1/flash-sales` | Public (current-active) / Staff+ (CRUD) |
| Inventory | `/api/v1/inventory` | Staff+ |
| Goods Receipts | `/api/v1/goods-receipts` | Staff+ |
| Reviews | `/api/v1/products/{id}/reviews` | Public (GET) / Auth (POST) |
| Comments | `/api/v1/products/{id}/comments` | Public (GET) / Auth (POST) |
| Notifications | `/api/v1/notifications` | Staff+ |
| Reports | `/api/v1/reports` | Staff+ / Admin+ (sensitive) |
| Chatbot | `/api/v1/chat/stream` | Public |
| Vector Sync | `/api/v1/admin/vector/sync` | Admin+ |
| GHN Webhook | `/api/webhook/ghn` | Internal (no auth) |
| WebSocket | `/ws/notifications` | JWT via STOMP header |

> Swagger UI: `http://localhost:8080/swagger-ui.html`

---

## 🚀 Hướng Dẫn Khởi Chạy

### Yêu Cầu
- Docker & Docker Compose
- Java 17+
- Node.js 18+

### 1. Khởi động Infrastructure

```bash
docker-compose up -d
# Khởi động: Redis (6379), RabbitMQ (5672 / UI: 15672), OpenSearch (9200)
```

### 2. Cấu hình Backend

Tạo `backend/src/main/resources/application-secret.yaml`:

```yaml
spring:
  mail:
    username:
    password:

jwt:
  signerKey:
  valid-duration: 3600
  refreshable-duration: 86400

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

app:
  google:
    client-id:

spring.ai.google.genai:
  api-key:

spring.ai.vectorstore.pinecone:
  api-key:
  index-name:
  namespace:

bonsai.opensearch:
  url:
  username:
  password:
```

### 3. Chạy Backend

```bash
cd backend
./mvnw spring-boot:run
# API: http://localhost:8080
# Swagger: http://localhost:8080/swagger-ui.html
```

### 4. Chạy Frontend

```bash
cd frontend
npm install
npm run dev
# Storefront: http://localhost:3000
# Admin Portal: http://localhost:3000/admin
```

### 5. Deploy Production

```bash
# Build và deploy toàn bộ stack
docker-compose -f docker-compose.prod.yml up -d --build

# CI/CD tự động qua GitHub Actions
# Push to main → build → test → deploy
```

---

## 📋 Kế Hoạch Phát Triển (Agile Scrum — 10 Sprints / 20 tuần)

| Sprint | Nội Dung | Trạng Thái |
|---|---|---|
| Sprint 1 | Core Setup: Spring Boot, MySQL, Next.js, CI/CD, Docker | ✅ Done |
| Sprint 2 | Authentication & User Management: JWT, RBAC, Address Book | ✅ Done |
| Sprint 3 | Product Management: Category, Brand, SKU, OpenSearch | ✅ Done |
| Sprint 4 | Inventory Management: GRN, QC, Stock Tracking, Audit Log | ✅ Done |
| Sprint 5 | Shopping Cart & Storefront: Homepage, PLP, PDP, Guest Cart, Mobile | ✅ Done |
| Sprint 6 | Order Management: State Machine, Lifecycle, Email (RabbitMQ), Cancel/Return | ✅ Done |
| Sprint 7 | Payment Integration: VNPay, COD, Coupon System | ✅ Done |
| Sprint 8 | Logistics Integration: GHN Webhook, Fulfillment, WebSocket Notifications | ✅ Done |
| Sprint 9 | Admin Portal, Flash Sale, AI Chatbot (RAG + Gemini), Reviews, Comments, Banner | ✅ Done |
| Sprint 10 | Reports & Analytics, User Management, Performance Testing, Docker Production, CI/CD | ✅ Done |

**Tổng Story Points hoàn thành:** ~341 / 341 ✅

---

## 📌 Điểm Nổi Bật Kỹ Thuật

### 1. Checkout Thread-Safe
Dùng `Optimistic Locking` (`@Version` trên `Inventory`) kết hợp `@Retryable` (retry 3 lần, backoff ngẫu nhiên) để xử lý đặt hàng đồng thời, tránh overselling. Khi xảy ra `ObjectOptimisticLockingFailureException`, Spring tự động retry transaction.

### 2. Flash Sale Zero-Overselling
Redis `DECR` atomic đảm bảo không bán quá số lượng dưới áp lực concurrency cao. Sau commit DB, `FlashSaleConsumer` đồng bộ `soldQuantity` về MySQL qua RabbitMQ bất đồng bộ — tránh làm chậm luồng checkout chính.

### 3. Cart Architecture
Toàn bộ giỏ hàng lưu Redis dạng JSON. Lua Script đảm bảo `read-modify-write` atomic khi thêm sản phẩm. Guest cart merge vào user cart khi đăng nhập, tránh mất dữ liệu.

### 4. AI RAG Pipeline
Google Gemini tạo embedding → lưu Pinecone. Khi chat, hệ thống retrieve top-3 vectors (cosine similarity ≥ 0.4) → inject context vào prompt → Gemini generate → stream về FE qua Server-Sent Events. Chat memory lưu JDBC MySQL per session.

### 5. GHN Webhook Idempotent
Luôn trả HTTP 200 cho GHN (tránh retry bão hòa), validate ShopID, kiểm tra trạng thái hiện tại trước khi ghi để đảm bảo idempotency. Dual-field update: `OrderStatus` (core) + `trackingStatus`/`trackingMessage` (hiển thị khách hàng).

### 6. Soft Delete Strategy
Sản phẩm/SKU đã có lịch sử nhập kho (GRN CONFIRMED) → soft delete (`isActive = false`), giữ toàn vẹn audit trail. Chưa có lịch sử → hard delete hoàn toàn.

### 7. Weighted Average Cost (WAC)
Mỗi lần xác nhận GRN, hệ thống tính lại `importPrice` bình quân theo công thức WAC và tự động tính lại `price = importPrice × (1 + profitMargin/100)`, đảm bảo giá bán luôn phản ánh chi phí thực tế.

### 8. WebSocket Security
JWT được xác thực qua custom `ChannelInterceptor` tại event `STOMP CONNECT`, nạp `Authentication` vào session WebSocket. Chỉ người dùng có role Staff+ mới kết nối được kênh admin.

### 9. Search Architecture
Kết hợp OpenSearch (fuzzy search → trả về ID list) với JPA Specification (lọc đa điều kiện + phân trang trên MySQL). Khi không có keyword, bỏ qua OpenSearch hoàn toàn để tiết kiệm tài nguyên.

### 10. Reporting với Native SQL Projections
Các báo cáo phức tạp (GROUP BY, RANK(), subquery) sử dụng native SQL qua interface-based JPA Projection — tránh load entity không cần thiết, cache Redis TTL 60 phút cho báo cáo lịch sử.

### 11. Return Flow an toàn
Khách request hoàn trả → `RETURN_REQUESTED` (chờ Admin). Admin approve → `RETURNED` + `releaseStock()`. Tồn kho **không** tự hoàn khi khách gửi request, tránh gian lận tồn kho.

### 12. RabbitMQ After-Commit Hook
Cả `OrderProducer` và `NotificationProducer` đăng ký `TransactionSynchronization.afterCommit()` — đảm bảo message chỉ được đẩy vào queue **sau khi** MySQL commit thành công, tránh tình trạng consumer nhận message trước khi data tồn tại trong DB.

---

## 👥 Phân Công Nhóm

| Thành viên | Vai trò |
|---|---|
| Nhóm 3C | Full-stack development |

---

## 📄 License

Dự án phục vụ mục đích học thuật (Đồ án chuyên ngành). Không sử dụng cho mục đích thương mại khi chưa được sự đồng ý của nhóm phát triển.