# Đồ Án Chuyên Ngành đề tài Nền tảng Thương mại Điện tử Đa kênh (Headless E-commerce)

# Công Nghệ Sử Dụng
## - Frontend: NextJS (React Framework) - TailwindCSS
## - Backend: Java Spring Boot (Monolith)
## - Database: MySQL - Redis (Cache) 
## - Integration: GHN, VNPAY, ElasticSearch, Cloudinary (Storage)


## Cấu trúc Frontend

```
frontend
├─ eslint.config.mjs
├─ jsconfig.json
├─ next.config.mjs
├─ package-lock.json
├─ package.json
├─ postcss.config.mjs
├─ public
│  ├─ file.svg
│  ├─ globe.svg
│  ├─ next.svg
│  ├─ vercel.svg
│  └─ window.svg
├─ README.md
└─ src
   ├─ app
   │  ├─ (admin)
   │  │  └─ admin
   │  │     ├─ brands
   │  │     │  └─ page.jsx
   │  │     ├─ categories
   │  │     │  └─ page.jsx
   │  │     ├─ dashboard
   │  │     │  └─ page.jsx
   │  │     ├─ layout.jsx
   │  │     ├─ login
   │  │     │  └─ page.jsx
   │  │     ├─ orders
   │  │     │  └─ page.jsx
   │  │     └─ products
   │  │        ├─ create
   │  │        │  └─ page.jsx
   │  │        ├─ edit
   │  │        │  └─ [id]
   │  │        │     └─ page.jsx
   │  │        ├─ page.jsx
   │  │        └─ [id]
   │  │           └─ page.jsx
   │  ├─ (shop)
   │  │  ├─ cart
   │  │  │  └─ page.jsx
   │  │  ├─ checkout
   │  │  │  └─ page.jsx
   │  │  ├─ layout.jsx
   │  │  ├─ order-success
   │  │  │  └─ page.jsx
   │  │  ├─ page.jsx
   │  │  ├─ products
   │  │  │  ├─ page.jsx
   │  │  │  └─ [id]
   │  │  │     └─ page.jsx
   │  │  └─ profile
   │  │     └─ page.jsx
   │  ├─ forgot-password
   │  │  └─ page.jsx
   │  ├─ globals.css
   │  ├─ layout.jsx
   │  ├─ login
   │  │  └─ page.jsx
   │  ├─ payment-result
   │  │  └─ page.jsx
   │  ├─ register
   │  │  └─ page.jsx
   │  ├─ reset-password
   │  │  └─ page.jsx
   │  └─ setup-address
   │     └─ page.jsx
   ├─ components
   │  ├─ admin
   │  │  ├─ AdminHeader.jsx
   │  │  └─ ImageUpload.jsx
   │  ├─ common
   │  │  └─ ToastProvider.jsx
   │  ├─ shop
   │  │  ├─ CartButton.jsx
   │  │  ├─ Footer.jsx
   │  │  ├─ Header.jsx
   │  │  ├─ ProductCard.jsx
   │  │  └─ ProductDetail.jsx
   │  └─ ui
   ├─ context
   │  ├─ AdminAuthContext.jsx
   │  ├─ AuthContext.jsx
   │  └─ CartContext.jsx
   ├─ lib
   │  └─ axios.jsx
   └─ services
      ├─ addressService.js
      ├─ authService.js
      ├─ brandService.js
      ├─ categoryService.js
      ├─ orderService.js
      ├─ paymentService.js
      ├─ productOptionService.js
      ├─ productService.js
      ├─ shippingService.js
      ├─ uploadService.js
      └─ userService.js

```

## Cấu trúc Backend
```
backend
├─ .mvn
│  └─ wrapper
│     └─ maven-wrapper.properties
├─ logs
│  ├─ application-2026-03-10.log
│  └─ application.log
├─ mvnw
├─ mvnw.cmd
├─ pom.xml
├─ README.md
└─ src
   ├─ Dockerfile
   ├─ main
   │  ├─ java
   │  │  └─ com
   │  │     └─ example
   │  │        └─ clothingstore
   │  │           ├─ ClothingstoreApplication.java
   │  │           ├─ config
   │  │           │  ├─ AppConfig.java
   │  │           │  ├─ auth
   │  │           │  │  ├─ CustomJwtDecoder.java
   │  │           │  │  └─ JwtAuthenticationEntryPoint.java
   │  │           │  ├─ CloudinaryConfig.java
   │  │           │  ├─ CryptoConfig.java
   │  │           │  ├─ GhnConfig.java
   │  │           │  ├─ OpenApiConfig.java
   │  │           │  ├─ RabbitMQConfig.java
   │  │           │  ├─ RedisConfig.java
   │  │           │  ├─ SecurityConfig.java
   │  │           │  └─ VnPayConfig.java
   │  │           ├─ controller
   │  │           │  ├─ AddressController.java
   │  │           │  ├─ AuthenticationController.java
   │  │           │  ├─ BrandController.java
   │  │           │  ├─ CategoryController.java
   │  │           │  ├─ OrderController.java
   │  │           │  ├─ PaymentController.java
   │  │           │  ├─ ProductController.java
   │  │           │  ├─ ProductOptionController.java
   │  │           │  ├─ ShippingController.java
   │  │           │  ├─ UserController.java
   │  │           │  └─ WebhookController.javaa
   │  │           ├─ document
   │  │           │  └─ ProductDocument.java
   │  │           ├─ dto
   │  │           │  ├─ auth
   │  │           │  │  ├─ request
   │  │           │  │  │  ├─ AuthenticationRequest.java
   │  │           │  │  │  ├─ ForgotPasswordRequest.java
   │  │           │  │  │  ├─ IntrospectRequest.java
   │  │           │  │  │  ├─ LogoutRequest.java
   │  │           │  │  │  ├─ RefreshTokenRequest.java
   │  │           │  │  │  └─ ResetPasswordRequest.java
   │  │           │  │  └─ response
   │  │           │  │     ├─ AuthenticationResponse.java
   │  │           │  │     └─ IntrospectResponse.java
   │  │           │  ├─ event
   │  │           │  │  └─ OrderMessage.java
   │  │           │  ├─ OrderDTO.java
   │  │           │  ├─ payment
   │  │           │  │  ├─ request
   │  │           │  │  └─ response
   │  │           │  │     └─ VnPayResponse.java
   │  │           │  ├─ ProductOptionDTO.java
   │  │           │  ├─ ProductOptionValueDTO.java
   │  │           │  ├─ request
   │  │           │  │  ├─ AddressRequest.java
   │  │           │  │  ├─ BrandRequest.java
   │  │           │  │  ├─ CategoryRequest.java
   │  │           │  │  ├─ ProductRequest.java
   │  │           │  │  ├─ UserCreationRequest.java
   │  │           │  │  └─ UserUpdateRequest.java
   │  │           │  ├─ response
   │  │           │  │  ├─ AddressResponse.java
   │  │           │  │  ├─ ApiResponse.java
   │  │           │  │  ├─ BrandResponse.java
   │  │           │  │  ├─ CategoryResponse.java
   │  │           │  │  ├─ OrderResponse.java
   │  │           │  │  ├─ ProductListResponse.java
   │  │           │  │  ├─ ProductResponse.java
   │  │           │  │  ├─ RoleResponse.java
   │  │           │  │  └─ UserResponse.java
   │  │           │  ├─ shipping
   │  │           │  │  ├─ request
   │  │           │  │  │  └─ GHNCreateOrderRequest.java
   │  │           │  │  └─ response
   │  │           │  └─ SkuDTO.java
   │  │           ├─ entity
   │  │           │  ├─ address
   │  │           │  │  ├─ Address.java
   │  │           │  │  ├─ District.java
   │  │           │  │  ├─ Province.java
   │  │           │  │  └─ Ward.java
   │  │           │  ├─ auth
   │  │           │  │  └─ InvalidatedToken.java
   │  │           │  ├─ Brand.java
   │  │           │  ├─ Category.java
   │  │           │  ├─ Customer.java
   │  │           │  ├─ Enum
   │  │           │  │  ├─ MembershipTier.java
   │  │           │  │  └─ OrderStatus.java
   │  │           │  ├─ Order.java
   │  │           │  ├─ OrderItem.java
   │  │           │  ├─ Permission.java
   │  │           │  ├─ Product.java
   │  │           │  ├─ ProductOption.java
   │  │           │  ├─ ProductOptionValue.java
   │  │           │  ├─ Role.java
   │  │           │  ├─ Sku.java
   │  │           │  ├─ SkuValue.java
   │  │           │  └─ User.java
   │  │           ├─ exception
   │  │           │  ├─ AppException.java
   │  │           │  ├─ ErrorCode.java
   │  │           │  └─ GlobalExceptionHandler.java
   │  │           ├─ mapper
   │  │           │  ├─ AddressMapper.java
   │  │           │  ├─ OrderMapper.java
   │  │           │  ├─ OrderResponseMapper.java
   │  │           │  ├─ ProductMapper.java
   │  │           │  ├─ ProductOptionMapper.java
   │  │           │  └─ UserMapper.java
   │  │           ├─ repository
   │  │           │  ├─ address
   │  │           │  │  ├─ DistrictRepository.java
   │  │           │  │  ├─ ProvinceRepository.java
   │  │           │  │  └─ WardRepository.java
   │  │           │  ├─ AddressRepository.java
   │  │           │  ├─ auth
   │  │           │  │  └─ InvalidatedTokenRepository.java
   │  │           │  ├─ BrandRepository.java
   │  │           │  ├─ CategoryRepository.java
   │  │           │  ├─ OrderItemRepository.java
   │  │           │  ├─ OrderRepository.java
   │  │           │  ├─ ProductOptionRepository.java
   │  │           │  ├─ ProductOptionValueRepository.java
   │  │           │  ├─ ProductRepository.java
   │  │           │  ├─ RoleRepository.java
   │  │           │  ├─ search
   │  │           │  │  └─ ProductSearchRepository.java
   │  │           │  ├─ SkuRepository.java
   │  │           │  ├─ SkuValueRepository.java
   │  │           │  ├─ specification
   │  │           │  │  └─ ProductSpecification.java
   │  │           │  └─ UserRepository.java
   │  │           └─ service
   │  │              ├─ BrandService.java
   │  │              ├─ CategoryService.java
   │  │              ├─ cloudinary
   │  │              │  └─ CloudinaryService.java
   │  │              ├─ impl
   │  │              │  ├─ AddressService.java
   │  │              │  ├─ AuthenticationService.java
   │  │              │  ├─ BrandServiceImpl.java
   │  │              │  ├─ CategoryServiceImpl.java
   │  │              │  ├─ GhnService.java
   │  │              │  ├─ OrderService.java
   │  │              │  ├─ ProductOptionServiceImpl.java
   │  │              │  ├─ ProductServiceImpl.java
   │  │              │  ├─ UserServiceImpl.java
   │  │              │  └─ VnPayService.java
   │  │              ├─ mail
   │  │              │  └─ MailService.java
   │  │              ├─ ProductOptionService.java
   │  │              ├─ ProductService.java
   │  │              ├─ rabbitmq
   │  │              │  ├─ OrderConsumer.java
   │  │              │  └─ OrderProducer.java
   │  │              └─ UserService.java
   │  └─ resources
   │     ├─ application.yaml
   │     ├─ db
   │     │  └─ migration
   │     │     └─ V1__init_schema.sql
   │     ├─ logback-spring.xml
   │     └─ templates
   │        ├─ email-order-success.html
   │        └─ test.html


```
