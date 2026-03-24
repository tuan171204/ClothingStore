SET FOREIGN_KEY_CHECKS = 0;

-- =======================================================
-- PHẦN 1: SCHEMA TỪ V1
-- =======================================================
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `addresses`
--

DROP TABLE IF EXISTS `addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `addresses` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `district_id` int DEFAULT NULL,
  `district_name` varchar(255) DEFAULT NULL,
  `is_default` bit(1) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `province_id` int DEFAULT NULL,
  `province_name` varchar(255) DEFAULT NULL,
  `receiver_name` varchar(255) DEFAULT NULL,
  `street_address` varchar(255) DEFAULT NULL,
  `ward_code` varchar(255) DEFAULT NULL,
  `ward_name` varchar(255) DEFAULT NULL,
  `user_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK1fa36y2oqhao3wgg2rw1pi459` (`user_id`),
  CONSTRAINT `FK1fa36y2oqhao3wgg2rw1pi459` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `brands`
--

DROP TABLE IF EXISTS `brands`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `brands` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `logo` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `parent_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKsaok720gsu4u2wrgbk10b5n8d` (`parent_id`),
  CONSTRAINT `FKsaok720gsu4u2wrgbk10b5n8d` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `user_id` varchar(255) NOT NULL,
  `birth_date` date DEFAULT NULL,
  `loyalty_points` int DEFAULT NULL,
  `membership_tier` enum('BRONZE','GOLD','SILVER') DEFAULT NULL,
  `phone_number` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `UK6v6x92wb400iwh6unf5rwiim4` (`phone_number`),
  CONSTRAINT `FKrh1g1a20omjmn6kurd35o3eit` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `districts`
--

DROP TABLE IF EXISTS `districts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `districts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `ghtk_id` bigint DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `province_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK82doq1t64jhly7a546lpvnu2c` (`province_id`),
  CONSTRAINT `FK82doq1t64jhly7a546lpvnu2c` FOREIGN KEY (`province_id`) REFERENCES `provinces` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `invalidated_token`
--

DROP TABLE IF EXISTS `invalidated_token`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invalidated_token` (
  `id` varchar(255) NOT NULL,
  `expiry_time` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `price_at_purchase` decimal(38,2) DEFAULT NULL,
  `product_name` varchar(255) DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  `sku_id` bigint DEFAULT NULL,
  `order_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKbioxgbv59vetrxe0ejfubep1w` (`order_id`),
  CONSTRAINT `FKbioxgbv59vetrxe0ejfubep1w` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `discount_amount` decimal(38,2) DEFAULT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `note` varchar(255) DEFAULT NULL,
  `payment_method` varchar(255) DEFAULT NULL,
  `phone_number` varchar(255) DEFAULT NULL,
  `shipping_address` varchar(255) DEFAULT NULL,
  `shipping_fee` decimal(38,2) DEFAULT NULL,
  `status` enum('CANCELLED','COMPLETED','CONFIRMED','PENDING','SHIPPING') DEFAULT NULL,
  `subtotal` decimal(38,2) DEFAULT NULL,
  `to_district_id` int DEFAULT NULL,
  `to_province_id` int DEFAULT NULL,
  `to_ward_code` varchar(255) DEFAULT NULL,
  `total_amount` decimal(38,2) DEFAULT NULL,
  `tracking_code` varchar(255) DEFAULT NULL,
  `user_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `method` varchar(255) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `resource` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKpnvtwliis6p05pn6i3ndjrqt2` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `product_option_values`
--

DROP TABLE IF EXISTS `product_option_values`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_option_values` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `value` varchar(255) NOT NULL,
  `option_id` bigint DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `FKmre6ippw97evhwrbl15ushuw` (`option_id`),
  CONSTRAINT `FKmre6ippw97evhwrbl15ushuw` FOREIGN KEY (`option_id`) REFERENCES `product_options` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `product_options`
--

DROP TABLE IF EXISTS `product_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_options` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `product_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK8vv4f8fru80wxocwgxwsrow61` (`product_id`),
  CONSTRAINT `FK8vv4f8fru80wxocwgxwsrow61` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `base_price` decimal(38,2) DEFAULT NULL,
  `description` text,
  `is_active` bit(1) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `thumbnail` varchar(255) DEFAULT NULL,
  `brand_id` bigint DEFAULT NULL,
  `category_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKa3a4mpsfdf4d2y6r8ra3sc8mv` (`brand_id`),
  KEY `FKog2rp4qthbtt2lfyhfo32lsw9` (`category_id`),
  CONSTRAINT `FKa3a4mpsfdf4d2y6r8ra3sc8mv` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`),
  CONSTRAINT `FKog2rp4qthbtt2lfyhfo32lsw9` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `provinces`
--

DROP TABLE IF EXISTS `provinces`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `provinces` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `ghtk_id` bigint DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `role`
--

DROP TABLE IF EXISTS `role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK8sewwnpamngi6b1dwaa88askk` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `role_id` bigint NOT NULL,
  `permission_id` bigint NOT NULL,
  PRIMARY KEY (`role_id`,`permission_id`),
  KEY `FKegdk29eiy7mdtefy5c7eirr6e` (`permission_id`),
  CONSTRAINT `FKegdk29eiy7mdtefy5c7eirr6e` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`),
  CONSTRAINT `FKlodb7xh4a2xjv39gc3lsop95n` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sku_values`
--

DROP TABLE IF EXISTS `sku_values`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sku_values` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `option_value_id` bigint DEFAULT NULL,
  `sku_id` bigint DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `FKh6lrv1vk1mfgr5nw93ehswqnq` (`option_value_id`),
  KEY `FKb5stuk37m8pdi8c05eg08320t` (`sku_id`),
  CONSTRAINT `FKb5stuk37m8pdi8c05eg08320t` FOREIGN KEY (`sku_id`) REFERENCES `skus` (`id`),
  CONSTRAINT `FKh6lrv1vk1mfgr5nw93ehswqnq` FOREIGN KEY (`option_value_id`) REFERENCES `product_option_values` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `skus`
--

DROP TABLE IF EXISTS `skus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `skus` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` varchar(255) DEFAULT NULL,
  `import_price` decimal(38,2) DEFAULT NULL,
  `price` decimal(38,2) DEFAULT NULL,
  `stock_quantity` int DEFAULT NULL,
  `product_id` bigint DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `img_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKqy7s1r7jfbq0pkqqt2icgnfpd` (`code`),
  KEY `FK49suh4vsoilpii18pb6j8adkp` (`product_id`),
  CONSTRAINT `FK49suhus4vsoilpii18pb6j8adkp` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(255) NOT NULL,
  `active` bit(1) NOT NULL,
  `created_at` date DEFAULT NULL,
  `dob` date NOT NULL,
  `email` varchar(255) NOT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `phone_number` varchar(255) DEFAULT NULL,
  `updated_at` date DEFAULT NULL,
  `username` varchar(255) NOT NULL,
  `role_id` bigint DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK6dotkott2kjsp8vw4d0m25fb7` (`email`),
  UNIQUE KEY `UKr43af9ap4edm43mmtq01oddj6` (`username`),
  KEY `FK4qu1gr772nnf6ve5af002rwya` (`role_id`),
  CONSTRAINT `FK4qu1gr772nnf6ve5af002rwya` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wards`
--

DROP TABLE IF EXISTS `wards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wards` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `ghtk_id` bigint DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `district_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKfjqt744bo800mb5uax74lav8k` (`district_id`),
  CONSTRAINT `FKfjqt744bo800mb5uax74lav8k` FOREIGN KEY (`district_id`) REFERENCES `districts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;


-- =======================================================
-- PHẦN 2: SCHEMA TỪ V2 (Inventory - Đã sửa lỗi VARCHAR)
-- =======================================================

CREATE TABLE inventory (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    sku_id              BIGINT          NOT NULL,
    physical_quantity   INT             NOT NULL DEFAULT 0,
    available_quantity  INT             NOT NULL DEFAULT 0,
    reserved_quantity   INT             NOT NULL DEFAULT 0,
    defect_quantity     INT             NOT NULL DEFAULT 0,
    low_stock_threshold INT             NOT NULL DEFAULT 0,

    PRIMARY KEY (id),
    UNIQUE KEY uq_inventory_sku (sku_id),
    CONSTRAINT fk_inventory_sku FOREIGN KEY (sku_id) REFERENCES skus (id) ON DELETE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- INV-002: Header phiếu nhập kho
CREATE TABLE goods_receipts (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    created_by VARCHAR(255),
    status     VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    note       TEXT,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_grn_user FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- INV-002 + INV-003: Dòng hàng trong phiếu nhập với dữ liệu QC
-- Constraint: quantity_passed + quantity_failed = quantity_received (validated at Service layer)
CREATE TABLE goods_receipt_items (
    id                BIGINT NOT NULL AUTO_INCREMENT,
    grn_id            BIGINT NOT NULL,
    sku_id            BIGINT NOT NULL,
    quantity_received INT    NOT NULL,
    quantity_passed   INT    NOT NULL DEFAULT 0,
    quantity_failed   INT    NOT NULL DEFAULT 0,

    PRIMARY KEY (id),
    CONSTRAINT fk_grni_grn FOREIGN KEY (grn_id) REFERENCES goods_receipts (id) ON DELETE CASCADE,
    CONSTRAINT fk_grni_sku FOREIGN KEY (sku_id) REFERENCES skus (id)            ON DELETE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- INV-006: Audit log toàn bộ biến động tồn kho
-- Ghi lại mọi thay đổi available_quantity: IN, OUT, ADJUSTMENT, RESERVE, RELEASE
CREATE TABLE stock_movements (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    sku_id          BIGINT       NOT NULL,
    movement_type   VARCHAR(20)  NOT NULL COMMENT 'IN|OUT|ADJUSTMENT|RESERVE|RELEASE',
    quantity        INT          NOT NULL,
    reference_type  VARCHAR(20)           COMMENT 'ORDER|GRN|ADJUSTMENT',
    reference_id    VARCHAR(100),
    before_quantity INT          NOT NULL,
    after_quantity  INT          NOT NULL,
    note            TEXT,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_movement_sku FOREIGN KEY (sku_id) REFERENCES skus (id) ON DELETE RESTRICT,
    INDEX idx_movement_sku    (sku_id),
    INDEX idx_movement_type   (movement_type),
    INDEX idx_movement_ref    (reference_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- INV-005: Phiếu điều chỉnh tồn kho thủ công, có audit trail
CREATE TABLE stock_adjustments (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    sku_id          BIGINT      NOT NULL,
    adjusted_by     VARCHAR(255),
    quantity_change INT         NOT NULL COMMENT 'Dương = nhập thêm, Âm = xuất bớt',
    reason          TEXT        NOT NULL,
    before_quantity INT         NOT NULL,
    after_quantity  INT         NOT NULL,
    created_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_adj_sku  FOREIGN KEY (sku_id)      REFERENCES skus  (id) ON DELETE RESTRICT,
    CONSTRAINT fk_adj_user FOREIGN KEY (adjusted_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- ==================================================================================================
-- PHẦN 3: MOCK DATA TỪ V3
-- ==================================================================================================
-- ============================================================
-- 1. ROLE
-- ============================================================
INSERT INTO `role` (`id`, `name`) VALUES
(1, 'USER'),
(2, 'ADMIN'),
(3, 'STAFF');

-- ============================================================
-- 2. PERMISSIONS
-- ============================================================
INSERT INTO `permissions` (`id`, `name`, `resource`, `method`) VALUES
(1,  'PRODUCT_VIEW',   'Product', 'GET'),
(2,  'PRODUCT_CREATE', 'Product', 'POST'),
(3,  'PRODUCT_UPDATE', 'Product', 'PUT'),
(4,  'PRODUCT_DELETE', 'Product', 'DELETE'),
(5,  'ORDER_VIEW',     'Order',   'GET'),
(6,  'ORDER_UPDATE',   'Order',   'PUT'),
(7,  'USER_VIEW',      'User',    'GET'),
(8,  'USER_UPDATE',    'User',    'PUT'),
(9,  'INVENTORY_VIEW', 'Inventory','GET'),
(10, 'INVENTORY_MANAGE','Inventory','POST');

-- ============================================================
-- 3. ROLE_PERMISSIONS (ADMIN có tất cả, STAFF có quyền hạn chế)
-- ============================================================
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
-- ADMIN
(2, 1),(2, 2),(2, 3),(2, 4),(2, 5),(2, 6),(2, 7),(2, 8),(2, 9),(2, 10),
-- STAFF
(3, 1),(3, 5),(3, 6),(3, 9),(3, 10),
-- USER
(1, 1),(1, 5);

-- ============================================================
-- 4. USERS
-- Password: "password123" được hash bằng BCrypt
-- Hash dưới đây hợp lệ cho tất cả user để dễ test
-- ============================================================
INSERT INTO `users` (`id`, `active`, `created_at`, `dob`, `updated_at`, `role_id`, `avatar`, `email`, `full_name`, `password`, `phone_number`, `username`) VALUES
('user-admin-001', b'1', '2026-01-01', '1990-05-15', '2026-01-01', 2, NULL,
 'admin@clothingstore.com', 'Admin Hệ Thống',
 '$2a$10$RSm8i3MXdkG.nCwzZHlbkeydA283dmxLtKZVfUo8txBsJ0OXteCRq',
 '0901000001', 'admin'),

('user-staff-001', b'1', '2026-01-05', '1995-08-20', '2026-01-05', 3, NULL,
 'staff01@clothingstore.com', 'Nguyễn Văn Kho',
 '$2a$10$RSm8i3MXdkG.nCwzZHlbkeydA283dmxLtKZVfUo8txBsJ0OXteCRq',
 '0901000002', 'staff01'),

('user-cus-001', b'1', '2026-01-10', '2000-03-12', '2026-01-10', 1, NULL,
 'customer01@gmail.com', 'Trần Thị Lan',
 '$2a$10$RSm8i3MXdkG.nCwzZHlbkeydA283dmxLtKZVfUo8txBsJ0OXteCRq',
 '0909111001', 'lan.tran'),

('user-cus-002', b'1', '2026-01-12', '1998-07-25', '2026-01-12', 1, NULL,
 'customer02@gmail.com', 'Lê Văn Hùng',
 '$2a$10$RSm8i3MXdkG.nCwzZHlbkeydA283dmxLtKZVfUo8txBsJ0OXteCRq',
 '0909111002', 'hung.le'),

('user-cus-003', b'1', '2026-01-15', '2001-11-30', '2026-01-15', 1, NULL,
 'customer03@gmail.com', 'Phạm Minh Tú',
 '$2a$10$RSm8i3MXdkG.nCwzZHlbkeydA283dmxLtKZVfUo8txBsJ0OXteCRq',
 '0909111003', 'tu.pham'),

('user-cus-004', b'1', '2026-02-01', '1999-04-18', '2026-02-01', 1, NULL,
 'customer04@gmail.com', 'Ngô Thị Bích',
 '$2a$10$RSm8i3MXdkG.nCwzZHlbkeydA283dmxLtKZVfUo8txBsJ0OXteCRq',
 '0909111004', 'bich.ngo'),

('user-cus-005', b'1', '2026-02-10', '1997-09-05', '2026-02-10', 1, NULL,
 'customer05@gmail.com', 'Đinh Công Thành',
 '$2a$10$RSm8i3MXdkG.nCwzZHlbkeydA283dmxLtKZVfUo8txBsJ0OXteCRq',
 '0909111005', 'thanh.dinh');

-- ============================================================
-- 5. CUSTOMERS (profile mở rộng của user có role USER)
-- ============================================================
INSERT INTO `customers` (`user_id`, `birth_date`, `loyalty_points`, `membership_tier`, `phone_number`) VALUES
('user-cus-001', '2000-03-12', 350,  'SILVER', '0909111001'),
('user-cus-002', '1998-07-25', 1200, 'GOLD',   '0909111002'),
('user-cus-003', '2001-11-30', 80,   'BRONZE', '0909111003'),
('user-cus-004', '1999-04-18', 500,  'SILVER', '0909111004'),
('user-cus-005', '1997-09-05', 0,    'BRONZE', '0909111005');

-- ============================================================
-- 6. BRANDS
-- ============================================================
INSERT INTO `brands` (`id`, `logo`, `name`) VALUES
(1, NULL, 'Coolmate'),
(2, NULL, 'Owen'),
(3, NULL, 'TheBlueTShirt'),
(4, NULL, 'Routine');

-- ============================================================
-- 7. CATEGORIES (cha → con)
-- ============================================================
INSERT INTO `categories` (`id`, `parent_id`, `name`) VALUES
(1, NULL, 'Thời trang Nam'),
(2, NULL, 'Thời trang Nữ'),
(3, NULL, 'Phụ kiện'),
(4, 1,    'Áo thun'),
(5, 1,    'Áo polo'),
(6, 1,    'Quần'),
(7, 2,    'Áo thun nữ'),
(8, 2,    'Đầm');

-- ============================================================
-- 8. PRODUCTS
-- ============================================================
INSERT INTO `products` (`id`, `base_price`, `description`, `is_active`, `name`, `thumbnail`, `brand_id`, `category_id`) VALUES
(1, 150000.00, 'Áo thun 100% Cotton Compact, thấm hút tốt, co giãn 4 chiều.',  b'1', 'Áo Thun Cotton Compact',    NULL, 1, 4),
(2, 280000.00, 'Áo polo pique cao cấp, cổ bẻ, phù hợp đi làm hoặc dạo phố.',   b'1', 'Áo Polo Pique Basic',       NULL, 2, 5),
(3, 320000.00, 'Quần kaki slim fit, chất liệu cotton pha, không nhăn.',          b'1', 'Quần Kaki Slim Fit',        NULL, 2, 6),
(4, 120000.00, 'Áo thun oversize form rộng, chất liệu cotton 65/35.',            b'1', 'Áo Thun Oversize Basic',    NULL, 3, 4),
(5, 350000.00, 'Áo polo thêu logo, chất cotton pique mềm mịn.',                  b'1', 'Áo Polo Thêu Logo',         NULL, 1, 5),
(6, 450000.00, 'Quần jogger cotton fleece, cạp thun, túi khóa kéo.',             b'1', 'Quần Jogger Cotton Fleece', NULL, 1, 6),
(7, 160000.00, 'Áo thun nữ cotton dáng ôm, màu pastel nhẹ nhàng.',              b'1', 'Áo Thun Nữ Pastel',         NULL, 4, 7),
(8, 550000.00, 'Đầm sơ mi kẻ sọc, chất liệu linen mát mẻ.',                     b'1', 'Đầm Sơ Mi Kẻ Sọc Linen',   NULL, 4, 8);

-- ============================================================
-- 9. PRODUCT_OPTIONS
-- ============================================================
INSERT INTO `product_options` (`id`, `name`, `product_id`) VALUES
-- Product 1: Áo Thun Cotton Compact
(1, 'Màu sắc',  1),
(2, 'Kích thước', 1),
-- Product 2: Áo Polo Pique Basic
(3, 'Màu sắc',  2),
(4, 'Kích thước', 2),
-- Product 3: Quần Kaki Slim Fit
(5, 'Màu sắc',  3),
(6, 'Kích thước', 3),
-- Product 4: Áo Thun Oversize Basic
(7, 'Màu sắc',  4),
(8, 'Kích thước', 4),
-- Product 5: Áo Polo Thêu Logo
(9,  'Màu sắc',   5),
(10, 'Kích thước', 5);

-- ============================================================
-- 10. PRODUCT_OPTION_VALUES
-- ============================================================
INSERT INTO `product_option_values` (`id`, `value`, `option_id`, `is_active`) VALUES
-- Màu sắc - Product 1
(1,  'Trắng', 1, 1), (2,  'Đen',   1, 1), (3,  'Đỏ',   1, 1), (4,  'Xanh navy', 1, 1),
-- Kích thước - Product 1
(5,  'S', 2, 1), (6,  'M', 2, 1), (7,  'L', 2, 1), (8,  'XL', 2, 1),
-- Màu sắc - Product 2
(9,  'Trắng', 3, 1), (10, 'Xanh navy', 3, 1), (11, 'Xám', 3, 1),
-- Kích thước - Product 2
(12, 'M', 4, 1), (13, 'L', 4, 1), (14, 'XL', 4, 1),
-- Màu sắc - Product 3
(15, 'Be', 5, 1), (16, 'Đen', 5, 1), (17, 'Xanh đậm', 5, 1),
-- Kích thước - Product 3
(18, '28', 6, 1), (19, '29', 6, 1), (20, '30', 6, 1), (21, '31', 6, 1),
-- Màu sắc - Product 4
(22, 'Trắng', 7, 1), (23, 'Đen', 7, 1), (24, 'Xanh', 7, 1),
-- Kích thước - Product 4
(25, 'M', 8, 1), (26, 'L', 8, 1), (27, 'XL', 8, 1),
-- Màu sắc - Product 5
(28, 'Trắng', 9, 1), (29, 'Xanh navy', 9, 1),
-- Kích thước - Product 5
(30, 'S', 10, 1), (31, 'M', 10, 1), (32, 'L', 10, 1), (33, 'XL', 10, 1);

-- ============================================================
-- 11. SKUS
-- ============================================================
INSERT INTO `skus` (`id`, `code`, `import_price`, `price`, `stock_quantity`, `product_id`, `is_active`, `img_url`) VALUES
-- Product 1: Áo Thun Cotton Compact (Trắng/Đen × S/M/L/XL → lấy đại diện 6 SKU)
(1,  'P1-WHITE-M',  90000,  150000, 50, 1, 1, NULL),
(2,  'P1-WHITE-L',  90000,  150000, 40, 1, 1, NULL),
(3,  'P1-BLACK-M',  90000,  150000, 45, 1, 1, NULL),
(4,  'P1-BLACK-L',  90000,  150000, 35, 1, 1, NULL),
(5,  'P1-RED-M',    90000,  160000, 30, 1, 1, NULL),
(6,  'P1-NAVY-XL',  90000,  160000, 20, 1, 1, NULL),
-- Product 2: Áo Polo Pique Basic
(7,  'P2-WHITE-M',  160000, 280000, 25, 2, 1, NULL),
(8,  'P2-WHITE-L',  160000, 280000, 20, 2, 1, NULL),
(9,  'P2-NAVY-M',   160000, 280000, 18, 2, 1, NULL),
(10, 'P2-NAVY-L',   160000, 290000, 15, 2, 1, NULL),
(11, 'P2-GRAY-XL',  160000, 290000, 10, 2, 1, NULL),
-- Product 3: Quần Kaki Slim Fit
(12, 'P3-BE-30',    180000, 320000, 20, 3, 1, NULL),
(13, 'P3-BLACK-30', 180000, 320000, 15, 3, 1, NULL),
(14, 'P3-NAVY-29',  180000, 320000, 12, 3, 1, NULL),
(15, 'P3-NAVY-31',  180000, 330000, 8,  3, 1, NULL),
-- Product 4: Áo Thun Oversize Basic
(16, 'P4-WHITE-L',  70000,  120000, 60, 4, 1, NULL),
(17, 'P4-BLACK-L',  70000,  120000, 55, 4, 1, NULL),
(18, 'P4-BLUE-XL',  70000,  120000, 40, 4, 1, NULL),
-- Product 5: Áo Polo Thêu Logo
(19, 'P5-WHITE-M',  200000, 350000, 20, 5, 1, NULL),
(20, 'P5-NAVY-L',   200000, 350000, 15, 5, 1, NULL);

-- ============================================================
-- 12. SKU_VALUES (gắn mỗi SKU với các option value tương ứng)
-- ============================================================
INSERT INTO `sku_values` (`id`, `sku_id`, `option_value_id`, `is_active`) VALUES
-- SKU 1: P1-WHITE-M → Trắng(1) + M(6)
(1,  1,  1,  1), (2,  1,  6,  1),
-- SKU 2: P1-WHITE-L → Trắng(1) + L(7)
(3,  2,  1,  1), (4,  2,  7,  1),
-- SKU 3: P1-BLACK-M → Đen(2) + M(6)
(5,  3,  2,  1), (6,  3,  6,  1),
-- SKU 4: P1-BLACK-L → Đen(2) + L(7)
(7,  4,  2,  1), (8,  4,  7,  1),
-- SKU 5: P1-RED-M → Đỏ(3) + M(6)
(9,  5,  3,  1), (10, 5,  6,  1),
-- SKU 6: P1-NAVY-XL → Xanh navy(4) + XL(8)
(11, 6,  4,  1), (12, 6,  8,  1),
-- SKU 7: P2-WHITE-M → Trắng(9) + M(12)
(13, 7,  9,  1), (14, 7,  12, 1),
-- SKU 8: P2-WHITE-L → Trắng(9) + L(13)
(15, 8,  9,  1), (16, 8,  13, 1),
-- SKU 9: P2-NAVY-M → Xanh navy(10) + M(12)
(17, 9,  10, 1), (18, 9,  12, 1),
-- SKU 10: P2-NAVY-L → Xanh navy(10) + L(13)
(19, 10, 10, 1), (20, 10, 13, 1),
-- SKU 11: P2-GRAY-XL → Xám(11) + XL(14)
(21, 11, 11, 1), (22, 11, 14, 1),
-- SKU 12: P3-BE-30 → Be(15) + 30(20)
(23, 12, 15, 1), (24, 12, 20, 1),
-- SKU 13: P3-BLACK-30 → Đen(16) + 30(20)
(25, 13, 16, 1), (26, 13, 20, 1),
-- SKU 14: P3-NAVY-29 → Xanh đậm(17) + 29(19)
(27, 14, 17, 1), (28, 14, 19, 1),
-- SKU 15: P3-NAVY-31 → Xanh đậm(17) + 31(21)
(29, 15, 17, 1), (30, 15, 21, 1),
-- SKU 16: P4-WHITE-L → Trắng(22) + L(26)
(31, 16, 22, 1), (32, 16, 26, 1),
-- SKU 17: P4-BLACK-L → Đen(23) + L(26)
(33, 17, 23, 1), (34, 17, 26, 1),
-- SKU 18: P4-BLUE-XL → Xanh(24) + XL(27)
(35, 18, 24, 1), (36, 18, 27, 1),
-- SKU 19: P5-WHITE-M → Trắng(28) + M(31)
(37, 19, 28, 1), (38, 19, 31, 1),
-- SKU 20: P5-NAVY-L → Xanh navy(29) + L(32)
(39, 20, 29, 1), (40, 20, 32, 1);

-- ============================================================
-- 13. INVENTORY (1 bản ghi per SKU)
-- available = physical - reserved
-- ============================================================
INSERT INTO `inventory` (`id`, `sku_id`, `physical_quantity`, `available_quantity`, `reserved_quantity`, `defect_quantity`, `low_stock_threshold`) VALUES
(1,  1,  50, 47, 3, 0, 10),
(2,  2,  40, 40, 0, 0, 10),
(3,  3,  45, 43, 2, 0, 10),
(4,  4,  35, 35, 0, 1, 10),
(5,  5,  30, 28, 2, 0,  5),
(6,  6,  20, 20, 0, 0,  5),
(7,  7,  25, 22, 3, 0,  5),
(8,  8,  20, 20, 0, 0,  5),
(9,  9,  18, 16, 2, 0,  5),
(10, 10, 15, 15, 0, 0,  5),
(11, 11, 10,  9, 1, 0,  3),
(12, 12, 20, 18, 2, 0,  5),
(13, 13, 15, 15, 0, 0,  5),
(14, 14, 12, 12, 0, 0,  3),
(15, 15,  8,  6, 2, 0,  3),
(16, 16, 60, 58, 2, 0, 10),
(17, 17, 55, 55, 0, 0, 10),
(18, 18, 40, 40, 0, 0, 10),
(19, 19, 20, 18, 2, 0,  5),
(20, 20, 15, 15, 0, 0,  5);

-- ============================================================
-- 14. ADDRESSES
-- ============================================================
INSERT INTO `addresses` (`id`, `user_id`, `receiver_name`, `phone`, `street_address`, `province_id`, `province_name`, `district_id`, `district_name`, `ward_code`, `ward_name`, `is_default`) VALUES
(1, 'user-cus-001', 'Trần Thị Lan',    '0909111001', '12 Nguyễn Huệ',          202, 'Hồ Chí Minh', 1442, 'Quận 1',        '20101', 'Phường Bến Nghé',  b'1'),
(2, 'user-cus-001', 'Trần Thị Lan',    '0909111001', '55 Lê Lợi',               202, 'Hồ Chí Minh', 1444, 'Quận 3',        '20301', 'Phường 1',         b'0'),
(3, 'user-cus-002', 'Lê Văn Hùng',     '0909111002', '88 Hoàng Diệu',          201, 'Hà Nội',      1490, 'Quận Ba Đình',  '10101', 'Phường Phúc Xá',   b'1'),
(4, 'user-cus-003', 'Phạm Minh Tú',    '0909111003', '3 Trần Phú',             206, 'Đà Nẵng',     490,  'Quận Hải Châu', '50101', 'Phường Hải Châu 1',b'1'),
(5, 'user-cus-004', 'Ngô Thị Bích',    '0909111004', '201 Võ Thị Sáu',        202, 'Hồ Chí Minh', 1446, 'Quận 5',        '20501', 'Phường 1',          b'1'),
(6, 'user-cus-005', 'Đinh Công Thành', '0909111005', '77 Pasteur',              202, 'Hồ Chí Minh', 1445, 'Quận 4',        '20401', 'Phường 1',          b'1');

-- ============================================================
-- 15. ORDERS
-- ============================================================
INSERT INTO `orders` (`id`, `user_id`, `full_name`, `phone_number`, `shipping_address`, `to_province_id`, `to_district_id`, `to_ward_code`, `subtotal`, `shipping_fee`, `discount_amount`, `total_amount`, `status`, `payment_method`, `note`, `created_at`, `tracking_code`) VALUES
(1, 'user-cus-001', 'Trần Thị Lan',    '0909111001', '12 Nguyễn Huệ, Phường Bến Nghé, Quận 1, HCM',      202, 1442, '20101', 300000.00, 30000.00,  0.00, 330000.00, 'COMPLETED', 'COD',    NULL,           '2026-01-20 10:00:00', 'GHN001'),
(2, 'user-cus-002', 'Lê Văn Hùng',     '0909111002', '88 Hoàng Diệu, Phường Phúc Xá, Quận Ba Đình, HN', 201, 1490, '10101', 280000.00, 35000.00,  0.00, 315000.00, 'COMPLETED', 'VNPAY',  NULL,           '2026-01-25 14:30:00', 'GHN002'),
(3, 'user-cus-001', 'Trần Thị Lan',    '0909111001', '12 Nguyễn Huệ, Phường Bến Nghé, Quận 1, HCM',      202, 1442, '20101', 450000.00, 30000.00, 45000.00, 435000.00, 'SHIPPING',  'COD',    'Giao giờ hành chính', '2026-02-05 09:15:00', 'GHN003'),
(4, 'user-cus-003', 'Phạm Minh Tú',    '0909111003', '3 Trần Phú, Phường Hải Châu 1, Quận Hải Châu, ĐN',206, 490,  '50101', 120000.00, 25000.00,  0.00, 145000.00, 'CONFIRMED', 'COD',    NULL,           '2026-02-10 16:45:00', NULL),
(5, 'user-cus-004', 'Ngô Thị Bích',    '0909111004', '201 Võ Thị Sáu, Phường 1, Quận 5, HCM',            202, 1446, '20501', 640000.00, 30000.00,  0.00, 670000.00, 'PENDING',   'VNPAY',  NULL,           '2026-02-20 11:00:00', NULL),
(6, NULL,           'Khách Vãng Lai',  '0908000001', '99 Lý Tự Trọng, Quận 1, HCM',                       202, 1442, '20101', 150000.00, 30000.00,  0.00, 180000.00, 'PENDING',   'COD',    NULL,           '2026-03-01 08:30:00', NULL),
(7, 'user-cus-002', 'Lê Văn Hùng',     '0909111002', '88 Hoàng Diệu, Phường Phúc Xá, Quận Ba Đình, HN', 201, 1490, '10101', 700000.00, 35000.00, 70000.00, 665000.00, 'CANCELLED', 'VNPAY',  'Đổi ý',       '2026-03-05 13:00:00', NULL),
(8, 'user-cus-005', 'Đinh Công Thành', '0909111005', '77 Pasteur, Phường 1, Quận 4, HCM',                 202, 1445, '20401', 470000.00, 30000.00,  0.00, 500000.00, 'COMPLETED', 'COD',    NULL,           '2026-03-10 17:20:00', 'GHN008');

-- ============================================================
-- 16. ORDER_ITEMS
-- ============================================================
INSERT INTO `order_items` (`id`, `order_id`, `sku_id`, `product_name`, `quantity`, `price_at_purchase`) VALUES
-- Order 1
(1,  1, 1,  'Áo Thun Cotton Compact - Trắng / M',  2, 150000.00),
-- Order 2
(2,  2, 7,  'Áo Polo Pique Basic - Trắng / M',      1, 280000.00),
-- Order 3
(3,  3, 12, 'Quần Kaki Slim Fit - Be / 30',          1, 320000.00),
(4,  3, 5,  'Áo Thun Cotton Compact - Đỏ / M',      1, 160000.00),
-- Order 4
(5,  4, 16, 'Áo Thun Oversize Basic - Trắng / L',   1, 120000.00),
-- Order 5
(6,  5, 19, 'Áo Polo Thêu Logo - Trắng / M',        1, 350000.00),
(7,  5, 12, 'Quần Kaki Slim Fit - Be / 30',          1, 320000.00),
-- Order 6
(8,  6, 1,  'Áo Thun Cotton Compact - Trắng / M',   1, 150000.00),
-- Order 7
(9,  7, 9,  'Áo Polo Pique Basic - Xanh navy / M',  1, 280000.00),
(10, 7, 15, 'Quần Kaki Slim Fit - Xanh đậm / 31',   1, 330000.00),
-- Order 8
(11, 8, 7,  'Áo Polo Pique Basic - Trắng / M',      1, 280000.00),
(12, 8, 18, 'Áo Thun Oversize Basic - Xanh / XL',   1, 120000.00),
(13, 8, 2,  'Áo Thun Cotton Compact - Trắng / L',   1, 150000.00);

-- ============================================================
-- 17. GOODS_RECEIPTS (Phiếu nhập kho)
-- ============================================================
INSERT INTO `goods_receipts` (`id`, `created_by`, `status`, `note`, `created_at`) VALUES
(1, 'user-staff-001', 'CONFIRMED', 'Nhập hàng đợt đầu tháng 1',  '2026-01-02 08:00:00'),
(2, 'user-staff-001', 'CONFIRMED', 'Nhập bổ sung áo polo',         '2026-01-20 09:00:00'),
(3, 'user-staff-001', 'PENDING',   'Đang chờ kiểm tra hàng mới',  '2026-03-20 14:00:00');

-- ============================================================
-- 18. GOODS_RECEIPT_ITEMS
-- ============================================================
INSERT INTO `goods_receipt_items` (`id`, `grn_id`, `sku_id`, `quantity_received`, `quantity_passed`, `quantity_failed`) VALUES
-- GRN 1
(1,  1, 1,  55, 50, 5),
(2,  1, 2,  42, 40, 2),
(3,  1, 3,  45, 45, 0),
(4,  1, 4,  36, 35, 1),
(5,  1, 5,  30, 30, 0),
(6,  1, 6,  20, 20, 0),
-- GRN 2
(7,  2, 7,  25, 25, 0),
(8,  2, 8,  22, 20, 2),
(9,  2, 9,  18, 18, 0),
(10, 2, 10, 16, 15, 1),
-- GRN 3 (PENDING - chưa confirm, chưa cộng vào tồn kho)
(11, 3, 16, 30, 0,  0),
(12, 3, 17, 30, 0,  0);

-- ============================================================
-- 19. STOCK_MOVEMENTS (biến động tồn kho - một số đại diện)
-- ============================================================
INSERT INTO `stock_movements` (`id`, `sku_id`, `movement_type`, `quantity`, `reference_type`, `reference_id`, `before_quantity`, `after_quantity`, `note`, `created_at`) VALUES
(1,  1,  'IN',      50, 'GRN',        '1', 0,  50, 'Nhập kho GRN #1',            '2026-01-02 08:30:00'),
(2,  2,  'IN',      40, 'GRN',        '1', 0,  40, 'Nhập kho GRN #1',            '2026-01-02 08:30:00'),
(3,  3,  'IN',      45, 'GRN',        '1', 0,  45, 'Nhập kho GRN #1',            '2026-01-02 08:30:00'),
(4,  1,  'RESERVE',  2, 'ORDER',      '1', 50, 48, 'Giữ chỗ cho đơn #1',         '2026-01-20 10:00:00'),
(5,  1,  'OUT',      2, 'ORDER',      '1', 48, 47, 'Xuất kho đơn #1 hoàn thành', '2026-01-22 15:00:00'),
(6,  7,  'IN',      25, 'GRN',        '2', 0,  25, 'Nhập kho GRN #2',            '2026-01-20 09:30:00'),
(7,  7,  'RESERVE',  1, 'ORDER',      '2', 25, 24, 'Giữ chỗ cho đơn #2',         '2026-01-25 14:30:00'),
(8,  7,  'OUT',      1, 'ORDER',      '2', 24, 22, 'Xuất kho đơn #2 hoàn thành', '2026-01-27 10:00:00'),
(9,  5,  'RESERVE',  2, 'ORDER',      '3', 30, 28, 'Giữ chỗ cho đơn #3',         '2026-02-05 09:15:00'),
(10, 9,  'RESERVE',  2, 'ORDER',      '7', 18, 16, 'Giữ chỗ cho đơn #7',         '2026-03-05 13:00:00'),
(11, 9,  'RELEASE',  2, 'ORDER',      '7', 16, 18, 'Giải phóng - đơn #7 hủy',    '2026-03-06 09:00:00');

-- ============================================================
-- 20. STOCK_ADJUSTMENTS (điều chỉnh thủ công)
-- ============================================================
INSERT INTO `stock_adjustments` (`id`, `sku_id`, `adjusted_by`, `quantity_change`, `reason`, `before_quantity`, `after_quantity`, `created_at`) VALUES
(1, 4, 'user-staff-001', -1, 'Phát hiện hàng lỗi khi kiểm kho định kỳ', 36, 35, '2026-02-15 10:00:00'),
(2, 8, 'user-staff-001', -2, 'Hàng bị ướt trong kho, không đủ tiêu chuẩn bán', 22, 20, '2026-02-15 10:30:00');



-- 4. BẬT LẠI KIỂM TRA KHÓA NGOẠI
SET FOREIGN_KEY_CHECKS = 1;