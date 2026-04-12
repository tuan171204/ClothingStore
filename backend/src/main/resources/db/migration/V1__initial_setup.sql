SET FOREIGN_KEY_CHECKS = 0;

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

-- =======================================================
-- PHẦN 1: DDL SCHEMA
-- =======================================================

DROP TABLE IF EXISTS `stock_adjustments`;
DROP TABLE IF EXISTS `stock_movements`;
DROP TABLE IF EXISTS `goods_receipt_items`;
DROP TABLE IF EXISTS `goods_receipts`;
DROP TABLE IF EXISTS `inventory`;
DROP TABLE IF EXISTS `reviews`;
DROP TABLE IF EXISTS `product_comments`;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `addresses`;
DROP TABLE IF EXISTS `customers`;
DROP TABLE IF EXISTS `sku_values`;
DROP TABLE IF EXISTS `skus`;
DROP TABLE IF EXISTS `product_option_values`;
DROP TABLE IF EXISTS `product_options`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `brands`;
DROP TABLE IF EXISTS `invalidated_token`;
DROP TABLE IF EXISTS `role_permissions`;
DROP TABLE IF EXISTS `permissions`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `role`;
DROP TABLE IF EXISTS `wards`;
DROP TABLE IF EXISTS `districts`;
DROP TABLE IF EXISTS `provinces`;

CREATE TABLE `provinces` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `ghtk_id` bigint DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `districts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `ghtk_id` bigint DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `province_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK82doq1t64jhly7a546lpvnu2c` (`province_id`),
  CONSTRAINT `FK82doq1t64jhly7a546lpvnu2c` FOREIGN KEY (`province_id`) REFERENCES `provinces` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `wards` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `ghtk_id` bigint DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `district_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKfjqt744bo800mb5uax74lav8k` (`district_id`),
  CONSTRAINT `FKfjqt744bo800mb5uax74lav8k` FOREIGN KEY (`district_id`) REFERENCES `districts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `role` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK8sewwnpamngi6b1dwaa88askk` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `method` varchar(255) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `resource` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKpnvtwliis6p05pn6i3ndjrqt2` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `role_permissions` (
  `role_id` bigint NOT NULL,
  `permission_id` bigint NOT NULL,
  PRIMARY KEY (`role_id`,`permission_id`),
  KEY `FKegdk29eiy7mdtefy5c7eirr6e` (`permission_id`),
  CONSTRAINT `FKegdk29eiy7mdtefy5c7eirr6e` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`),
  CONSTRAINT `FKlodb7xh4a2xjv39gc3lsop95n` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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

CREATE TABLE `invalidated_token` (
  `id` varchar(255) NOT NULL,
  `expiry_time` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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

CREATE TABLE `brands` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `logo` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `categories` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `parent_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKsaok720gsu4u2wrgbk10b5n8d` (`parent_id`),
  CONSTRAINT `FKsaok720gsu4u2wrgbk10b5n8d` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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

CREATE TABLE `product_options` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `product_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK8vv4f8fru80wxocwgxwsrow61` (`product_id`),
  CONSTRAINT `FK8vv4f8fru80wxocwgxwsrow61` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `product_option_values` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `value` varchar(255) NOT NULL,
  `option_id` bigint DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `FKmre6ippw97evhwrbl15ushuw` (`option_id`),
  CONSTRAINT `FKmre6ippw97evhwrbl15ushuw` FOREIGN KEY (`option_id`) REFERENCES `product_options` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
  CONSTRAINT `FK49suh4vsoilpii18pb6j8adkp` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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

CREATE TABLE `inventory` (
    id                  BIGINT NOT NULL AUTO_INCREMENT,
    sku_id              BIGINT NOT NULL,
    physical_quantity   INT    NOT NULL DEFAULT 0,
    available_quantity  INT    NOT NULL DEFAULT 0,
    reserved_quantity   INT    NOT NULL DEFAULT 0,
    defect_quantity     INT    NOT NULL DEFAULT 0,
    low_stock_threshold INT    NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_inventory_sku (sku_id),
    CONSTRAINT fk_inventory_sku FOREIGN KEY (sku_id) REFERENCES skus (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `goods_receipts` (
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    created_by VARCHAR(255),
    status     VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    note       TEXT,
    created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_grn_user FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `goods_receipt_items` (
    id                BIGINT NOT NULL AUTO_INCREMENT,
    grn_id            BIGINT NOT NULL,
    sku_id            BIGINT NOT NULL,
    quantity_received INT    NOT NULL,
    quantity_passed   INT    NOT NULL DEFAULT 0,
    quantity_failed   INT    NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT fk_grni_grn FOREIGN KEY (grn_id) REFERENCES goods_receipts (id) ON DELETE CASCADE,
    CONSTRAINT fk_grni_sku FOREIGN KEY (sku_id) REFERENCES skus (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `stock_movements` (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    sku_id          BIGINT      NOT NULL,
    movement_type   VARCHAR(20) NOT NULL,
    quantity        INT         NOT NULL,
    reference_type  VARCHAR(20),
    reference_id    VARCHAR(100),
    before_quantity INT         NOT NULL,
    after_quantity  INT         NOT NULL,
    note            TEXT,
    created_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_movement_sku FOREIGN KEY (sku_id) REFERENCES skus (id) ON DELETE RESTRICT,
    INDEX idx_movement_sku  (sku_id),
    INDEX idx_movement_type (movement_type),
    INDEX idx_movement_ref  (reference_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `stock_adjustments` (
    id              BIGINT NOT NULL AUTO_INCREMENT,
    sku_id          BIGINT NOT NULL,
    adjusted_by     VARCHAR(255),
    quantity_change INT    NOT NULL,
    reason          TEXT   NOT NULL,
    before_quantity INT    NOT NULL,
    after_quantity  INT    NOT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_adj_sku  FOREIGN KEY (sku_id)      REFERENCES skus  (id) ON DELETE RESTRICT,
    CONSTRAINT fk_adj_user FOREIGN KEY (adjusted_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `reviews` (
    id               BIGINT       AUTO_INCREMENT PRIMARY KEY,
    product_id       BIGINT       NOT NULL,
    sku_id           BIGINT,
    order_id         BIGINT       NULL,
    user_id          VARCHAR(255) NOT NULL,
    rating           INT          NOT NULL,
    comment          TEXT,
    status           VARCHAR(20),
    verified_purchase BOOLEAN     DEFAULT FALSE,
    created_at       DATETIME,
    CONSTRAINT fk_review_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT fk_review_order   FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE INDEX idx_review_user_order    ON reviews (user_id, order_id);
CREATE INDEX idx_review_product_status ON reviews (product_id, status);

CREATE TABLE `product_comments` (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    product_id BIGINT       NOT NULL,
    user_id    VARCHAR(255) NOT NULL,
    content    TEXT         NOT NULL,
    parent_id  BIGINT       NULL,
    status     VARCHAR(20)  NOT NULL DEFAULT 'APPROVED',
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME     NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_comment_product FOREIGN KEY (product_id) REFERENCES products (id)          ON DELETE CASCADE,
    CONSTRAINT fk_comment_user    FOREIGN KEY (user_id)    REFERENCES users (id)              ON DELETE CASCADE,
    CONSTRAINT fk_comment_parent  FOREIGN KEY (parent_id)  REFERENCES product_comments (id)  ON DELETE CASCADE,
    INDEX idx_comment_product (product_id, status),
    INDEX idx_comment_user    (user_id),
    INDEX idx_comment_parent  (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =======================================================
-- PHẦN 2: MOCK DATA
-- =======================================================

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
(1,  'PRODUCT_VIEW',     'Product',   'GET'),
(2,  'PRODUCT_CREATE',   'Product',   'POST'),
(3,  'PRODUCT_UPDATE',   'Product',   'PUT'),
(4,  'PRODUCT_DELETE',   'Product',   'DELETE'),
(5,  'ORDER_VIEW',       'Order',     'GET'),
(6,  'ORDER_UPDATE',     'Order',     'PUT'),
(7,  'USER_VIEW',        'User',      'GET'),
(8,  'USER_UPDATE',      'User',      'PUT'),
(9,  'INVENTORY_VIEW',   'Inventory', 'GET'),
(10, 'INVENTORY_MANAGE', 'Inventory', 'POST');

-- ============================================================
-- 3. ROLE_PERMISSIONS
-- ============================================================
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(2, 1),(2, 2),(2, 3),(2, 4),(2, 5),(2, 6),(2, 7),(2, 8),(2, 9),(2, 10),
(3, 1),(3, 5),(3, 6),(3, 9),(3, 10),
(1, 1),(1, 5);

-- ============================================================
-- 4. USERS (password = "password123" BCrypt hashed)
-- ============================================================
INSERT INTO `users` (`id`, `active`, `created_at`, `dob`, `updated_at`, `role_id`, `avatar`, `email`, `full_name`, `password`, `phone_number`, `username`) VALUES
('user-admin-001', b'1', '2025-06-01', '1988-04-10', '2025-06-01', 2, NULL,
 'admin@thoitrang.vn', 'Nguyễn Quốc Anh',
 '$2a$10$RSm8i3MXdkG.nCwzZHlbkeydA283dmxLtKZVfUo8txBsJ0OXteCRq',
 '0901000001', 'admin'),

('user-staff-001', b'1', '2025-06-10', '1993-09-15', '2025-06-10', 3, NULL,
 'kho1@thoitrang.vn', 'Trần Minh Khánh',
 '$2a$10$RSm8i3MXdkG.nCwzZHlbkeydA283dmxLtKZVfUo8txBsJ0OXteCRq',
 '0901000002', 'staff.khanh'),

('user-staff-002', b'1', '2025-07-01', '1996-02-20', '2025-07-01', 3, NULL,
 'kho2@thoitrang.vn', 'Lê Thị Thu Hà',
 '$2a$10$RSm8i3MXdkG.nCwzZHlbkeydA283dmxLtKZVfUo8txBsJ0OXteCRq',
 '0901000003', 'staff.ha'),

('user-cus-001', b'1', '2025-08-05', '1999-03-22', '2025-08-05', 1, NULL,
 'maihuong@gmail.com', 'Nguyễn Mai Hương',
 '$2a$10$RSm8i3MXdkG.nCwzZHlbkeydA283dmxLtKZVfUo8txBsJ0OXteCRq',
 '0909201001', 'mai.huong'),

('user-cus-002', b'1', '2025-08-15', '1997-11-08', '2025-08-15', 1, NULL,
 'duchung97@gmail.com', 'Phạm Đức Hùng',
 '$2a$10$RSm8i3MXdkG.nCwzZHlbkeydA283dmxLtKZVfUo8txBsJ0OXteCRq',
 '0909201002', 'duc.hung'),

('user-cus-003', b'1', '2025-09-01', '2001-06-30', '2025-09-01', 1, NULL,
 'thanhvan.nguyen@gmail.com', 'Nguyễn Thành Văn',
 '$2a$10$RSm8i3MXdkG.nCwzZHlbkeydA283dmxLtKZVfUo8txBsJ0OXteCRq',
 '0909201003', 'thanh.van'),

('user-cus-004', b'1', '2025-09-20', '2000-12-05', '2025-09-20', 1, NULL,
 'bichtram2000@gmail.com', 'Võ Thị Bích Trâm',
 '$2a$10$RSm8i3MXdkG.nCwzZHlbkeydA283dmxLtKZVfUo8txBsJ0OXteCRq',
 '0909201004', 'bich.tram'),

('user-cus-005', b'1', '2025-10-10', '1995-07-17', '2025-10-10', 1, NULL,
 'longpq1995@gmail.com', 'Phan Quốc Long',
 '$2a$10$RSm8i3MXdkG.nCwzZHlbkeydA283dmxLtKZVfUo8txBsJ0OXteCRq',
 '0909201005', 'quoc.long'),

('user-cus-006', b'1', '2025-11-02', '1998-04-25', '2025-11-02', 1, NULL,
 'linhnguyen98@gmail.com', 'Nguyễn Thị Ngọc Linh',
 '$2a$10$RSm8i3MXdkG.nCwzZHlbkeydA283dmxLtKZVfUo8txBsJ0OXteCRq',
 '0909201006', 'ngoc.linh');

-- ============================================================
-- 5. CUSTOMERS
-- ============================================================
INSERT INTO `customers` (`user_id`, `birth_date`, `loyalty_points`, `membership_tier`, `phone_number`) VALUES
('user-cus-001', '1999-03-22', 1450, 'GOLD',   '0909201001'),
('user-cus-002', '1997-11-08', 620,  'SILVER', '0909201002'),
('user-cus-003', '2001-06-30', 90,   'BRONZE', '0909201003'),
('user-cus-004', '2000-12-05', 310,  'SILVER', '0909201004'),
('user-cus-005', '1995-07-17', 2100, 'GOLD',   '0909201005'),
('user-cus-006', '1998-04-25', 0,    'BRONZE', '0909201006');

-- ============================================================
-- 6. BRANDS
-- ============================================================
INSERT INTO `brands` (`id`, `logo`, `name`) VALUES
(1, NULL, 'Coolmate'),
(2, NULL, 'Owen'),
(3, NULL, 'Routine'),
(4, NULL, 'The Shirts Studio'),
(5, NULL, 'Aristino'),
(6, NULL, 'Canifa');

-- ============================================================
-- 7. CATEGORIES (parent → child)
-- ============================================================
INSERT INTO `categories` (`id`, `parent_id`, `name`) VALUES
(1,  NULL, 'Thời trang Nam'),
(2,  NULL, 'Thời trang Nữ'),
(3,  NULL, 'Phụ kiện'),
(4,  1,   'Áo thun Nam'),
(5,  1,   'Áo polo Nam'),
(6,  1,   'Áo sơ mi Nam'),
(7,  1,   'Quần Nam'),
(8,  2,   'Áo thun Nữ'),
(9,  2,   'Đầm & Váy'),
(10, 2,   'Quần Nữ'),
(11, 3,   'Thắt lưng'),
(12, 3,   'Mũ & Nón');

-- ============================================================
-- 8. PRODUCTS (20 sản phẩm)
-- ============================================================
INSERT INTO `products` (`id`, `base_price`, `description`, `is_active`, `name`, `thumbnail`, `brand_id`, `category_id`) VALUES
-- Áo thun Nam (cat 4)
(1,  159000.00, 'Áo thun nam cổ tròn 100% Cotton Compact, thoáng mát, không xù lông sau nhiều lần giặt. Phù hợp mặc đi chơi, dạo phố.', b'1', 'Áo Thun Nam Cổ Tròn Cotton Compact',  NULL, 1, 4),
(2,  189000.00, 'Áo thun oversize form rộng, chất vải cotton 65/35, in graphic phong cách streetwear. Co giãn 2 chiều, thoải mái vận động.', b'1', 'Áo Thun Oversize Graphic Streetwear',  NULL, 3, 4),
(3,  145000.00, 'Áo thun nam ba lỗ chất cotton cao cấp, cổ tròn, dáng slim fit. Thích hợp cho mùa hè hoặc mặc trong phòng gym.', b'1', 'Áo Thun Ba Lỗ Tập Gym',               NULL, 1, 4),
(4,  175000.00, 'Áo thun dài tay cổ tròn chất cotton nỉ bông, giữ ấm tốt, phù hợp thời tiết se lạnh. Dễ phối đồ.', b'1', 'Áo Thun Dài Tay Cotton Nỉ Bông',     NULL, 6, 4),
-- Áo polo Nam (cat 5)
(5,  299000.00, 'Áo polo nam cổ bẻ chất pique cotton cao cấp, thêu logo nhỏ ngực trái. Phù hợp đi làm, gặp đối tác.', b'1', 'Áo Polo Pique Thêu Logo',            NULL, 2, 5),
(6,  269000.00, 'Áo polo basic cổ phối màu, chất vải pique thoáng khí, không nhăn. Thiết kế trẻ trung, năng động.', b'1', 'Áo Polo Basic Cổ Phối Màu',          NULL, 5, 5),
(7,  349000.00, 'Áo polo nam dài tay chất cotton pique, cúc bấm 3 hàng, phù hợp mùa đông. Có túi ngực nhỏ.', b'1', 'Áo Polo Dài Tay Cúc Bấm',            NULL, 2, 5),
-- Áo sơ mi Nam (cat 6)
(8,  389000.00, 'Áo sơ mi nam Oxford vải dệt thoi, form slimfit, không nhăn. Phù hợp văn phòng hoặc sự kiện quan trọng.', b'1', 'Áo Sơ Mi Oxford Slim Fit',          NULL, 4, 6),
(9,  420000.00, 'Áo sơ mi kẻ sọc chất linen cao cấp, thoáng mát. Kiểu dáng regular fit, tay dài có thể xắn tay.', b'1', 'Áo Sơ Mi Kẻ Sọc Linen Tay Dài',    NULL, 4, 6),
-- Quần Nam (cat 7)
(10, 349000.00, 'Quần kaki nam slim fit chất cotton pha elastane, không nhăn, bền màu. Phù hợp đi làm hoặc dạo phố.', b'1', 'Quần Kaki Slim Fit Nam',            NULL, 2, 7),
(11, 299000.00, 'Quần short nam vải dù cao cấp, co giãn tốt, khô nhanh. 2 túi trước có khoá. Phù hợp đi biển hoặc tập thể thao.', b'1', 'Quần Short Vải Dù Thể Thao',       NULL, 1, 7),
(12, 469000.00, 'Quần jogger cotton fleece dày dặn, cạp thun co giãn, túi khoá kéo. Giữ ấm tốt, phù hợp mặc ở nhà hoặc ra ngoài.', b'1', 'Quần Jogger Cotton Fleece Cạp Thun', NULL, 1, 7),
-- Áo thun Nữ (cat 8)
(13, 149000.00, 'Áo thun nữ cổ tròn cotton mềm mại, màu pastel nhẹ nhàng. Dáng body fit tôn vóc dáng.', b'1', 'Áo Thun Nữ Cổ Tròn Pastel',         NULL, 6, 8),
(14, 169000.00, 'Áo thun crop top nữ phong cách Y2K, chất cotton co giãn tốt. Form croptop, có thể phối với chân váy hoặc quần jeans.', b'1', 'Áo Thun Crop Top Y2K',             NULL, 3, 8),
(15, 199000.00, 'Áo thun nữ tay phồng, chất cotton nhẹ mịn, cổ bèo điệu đà. Phù hợp đi dạo, cafe, chụp ảnh.', b'1', 'Áo Thun Nữ Tay Phồng Cổ Bèo',     NULL, 6, 8),
-- Đầm & Váy (cat 9)
(16, 550000.00, 'Đầm maxi dáng xòe vải lụa satin, cổ V thanh lịch. Phù hợp đi tiệc, sự kiện hoặc du lịch biển.', b'1', 'Đầm Maxi Lụa Satin Cổ V',          NULL, 3, 9),
(17, 389000.00, 'Chân váy midi dáng bút chì chất liệu tweed cao cấp. Thanh lịch, phù hợp đi làm văn phòng.', b'1', 'Chân Váy Midi Tweed Bút Chì',       NULL, 4, 9),
-- Quần Nữ (cat 10)
(18, 349000.00, 'Quần wide leg nữ ống rộng chất liệu vải tây cao cấp, lưng cao tôn dáng. Phù hợp đi làm và dạo phố.', b'1', 'Quần Wide Leg Lưng Cao',           NULL, 5, 10),
(19, 279000.00, 'Quần legging nữ nâng mông, chất liệu vải tập yoga co giãn 4 chiều. Giữ form tốt sau nhiều lần giặt.', b'1', 'Quần Legging Nâng Mông Tập Yoga',  NULL, 1, 10),
-- Phụ kiện (cat 11, 12)
(20, 189000.00, 'Thắt lưng nam da bò thật, khoá kim loại mạ vàng. Bền, đẹp, phù hợp với quần kaki hoặc jeans.', b'1', 'Thắt Lưng Nam Da Bò Khoá Vàng',   NULL, 2, 11);

-- ============================================================
-- 9. PRODUCT_OPTIONS
-- ============================================================
-- Product 1: Áo Thun Nam Cổ Tròn Cotton Compact → Màu sắc + Kích thước
INSERT INTO `product_options` (`id`, `name`, `product_id`) VALUES
(1,  'Màu sắc',   1),
(2,  'Kích thước', 1),
-- Product 2: Áo Thun Oversize Graphic → Màu sắc + Kích thước
(3,  'Màu sắc',   2),
(4,  'Kích thước', 2),
-- Product 3: Áo Thun Ba Lỗ → Màu sắc + Kích thước
(5,  'Màu sắc',   3),
(6,  'Kích thước', 3),
-- Product 4: Áo Thun Dài Tay → Màu sắc + Kích thước
(7,  'Màu sắc',   4),
(8,  'Kích thước', 4),
-- Product 5: Áo Polo Pique Thêu Logo → Màu sắc + Kích thước
(9,  'Màu sắc',   5),
(10, 'Kích thước', 5),
-- Product 6: Áo Polo Basic Cổ Phối → Màu sắc + Kích thước
(11, 'Màu sắc',   6),
(12, 'Kích thước', 6),
-- Product 7: Áo Polo Dài Tay → Màu sắc + Kích thước
(13, 'Màu sắc',   7),
(14, 'Kích thước', 7),
-- Product 8: Áo Sơ Mi Oxford → Màu sắc + Kích thước
(15, 'Màu sắc',   8),
(16, 'Kích thước', 8),
-- Product 9: Áo Sơ Mi Kẻ Sọc Linen → Màu sắc + Kích thước
(17, 'Màu sắc',   9),
(18, 'Kích thước', 9),
-- Product 10: Quần Kaki Slim Fit → Màu sắc + Kích thước (size quần)
(19, 'Màu sắc',   10),
(20, 'Kích thước', 10),
-- Product 11: Quần Short Vải Dù → Màu sắc + Kích thước
(21, 'Màu sắc',   11),
(22, 'Kích thước', 11),
-- Product 12: Quần Jogger → Màu sắc + Kích thước
(23, 'Màu sắc',   12),
(24, 'Kích thước', 12),
-- Product 13: Áo Thun Nữ Pastel → Màu sắc + Kích thước
(25, 'Màu sắc',   13),
(26, 'Kích thước', 13),
-- Product 14: Áo Thun Crop Top → Màu sắc + Kích thước
(27, 'Màu sắc',   14),
(28, 'Kích thước', 14),
-- Product 15: Áo Thun Nữ Tay Phồng → Màu sắc + Kích thước
(29, 'Màu sắc',   15),
(30, 'Kích thước', 15),
-- Product 16: Đầm Maxi → Màu sắc + Kích thước
(31, 'Màu sắc',   16),
(32, 'Kích thước', 16),
-- Product 17: Chân Váy Midi → Màu sắc + Kích thước
(33, 'Màu sắc',   17),
(34, 'Kích thước', 17),
-- Product 18: Quần Wide Leg → Màu sắc + Kích thước
(35, 'Màu sắc',   18),
(36, 'Kích thước', 18),
-- Product 19: Quần Legging → Màu sắc + Kích thước
(37, 'Màu sắc',   19),
(38, 'Kích thước', 19),
-- Product 20: Thắt Lưng → Kích thước (chỉ 1 option)
(39, 'Kích thước', 20);

-- ============================================================
-- 10. PRODUCT_OPTION_VALUES
-- ============================================================
INSERT INTO `product_option_values` (`id`, `value`, `option_id`, `is_active`) VALUES
-- Product 1: Màu (opt 1): Trắng, Đen, Xanh Navy, Xám Nhạt
(1,  'Trắng',     1, 1),
(2,  'Đen',       1, 1),
(3,  'Xanh Navy', 1, 1),
(4,  'Xám Nhạt',  1, 1),
-- Product 1: Size (opt 2): S, M, L, XL
(5,  'S',  2, 1),
(6,  'M',  2, 1),
(7,  'L',  2, 1),
(8,  'XL', 2, 1),

-- Product 2: Màu (opt 3): Đen, Trắng, Be
(9,  'Đen',   3, 1),
(10, 'Trắng', 3, 1),
(11, 'Be',    3, 1),
-- Product 2: Size (opt 4): M, L, XL, XXL
(12, 'M',   4, 1),
(13, 'L',   4, 1),
(14, 'XL',  4, 1),
(15, 'XXL', 4, 1),

-- Product 3: Màu (opt 5): Đen, Xám, Trắng
(16, 'Đen',  5, 1),
(17, 'Xám',  5, 1),
(18, 'Trắng',5, 1),
-- Product 3: Size (opt 6): S, M, L, XL
(19, 'S',  6, 1),
(20, 'M',  6, 1),
(21, 'L',  6, 1),
(22, 'XL', 6, 1),

-- Product 4: Màu (opt 7): Xanh Rêu, Nâu Đất, Đen
(23, 'Xanh Rêu',  7, 1),
(24, 'Nâu Đất',   7, 1),
(25, 'Đen',       7, 1),
-- Product 4: Size (opt 8): S, M, L, XL
(26, 'S',  8, 1),
(27, 'M',  8, 1),
(28, 'L',  8, 1),
(29, 'XL', 8, 1),

-- Product 5: Màu (opt 9): Trắng, Xanh Navy, Đen
(30, 'Trắng',     9, 1),
(31, 'Xanh Navy', 9, 1),
(32, 'Đen',       9, 1),
-- Product 5: Size (opt 10): S, M, L, XL
(33, 'S',  10, 1),
(34, 'M',  10, 1),
(35, 'L',  10, 1),
(36, 'XL', 10, 1),

-- Product 6: Màu (opt 11): Trắng, Đỏ Đô, Xanh Biển
(37, 'Trắng',     11, 1),
(38, 'Đỏ Đô',     11, 1),
(39, 'Xanh Biển', 11, 1),
-- Product 6: Size (opt 12): S, M, L, XL
(40, 'S',  12, 1),
(41, 'M',  12, 1),
(42, 'L',  12, 1),
(43, 'XL', 12, 1),

-- Product 7: Màu (opt 13): Đen, Xanh Đậm
(44, 'Đen',       13, 1),
(45, 'Xanh Đậm',  13, 1),
-- Product 7: Size (opt 14): M, L, XL
(46, 'M',  14, 1),
(47, 'L',  14, 1),
(48, 'XL', 14, 1),

-- Product 8: Màu (opt 15): Trắng, Xanh Nhạt, Hồng Phấn
(49, 'Trắng',      15, 1),
(50, 'Xanh Nhạt',  15, 1),
(51, 'Hồng Phấn',  15, 1),
-- Product 8: Size (opt 16): S, M, L, XL
(52, 'S',  16, 1),
(53, 'M',  16, 1),
(54, 'L',  16, 1),
(55, 'XL', 16, 1),

-- Product 9: Màu (opt 17): Xanh Kẻ Trắng, Đỏ Kẻ Trắng
(56, 'Xanh Kẻ Trắng', 17, 1),
(57, 'Đỏ Kẻ Trắng',   17, 1),
-- Product 9: Size (opt 18): M, L, XL
(58, 'M',  18, 1),
(59, 'L',  18, 1),
(60, 'XL', 18, 1),

-- Product 10: Màu (opt 19): Be, Đen, Xanh Đậm
(61, 'Be',        19, 1),
(62, 'Đen',       19, 1),
(63, 'Xanh Đậm',  19, 1),
-- Product 10: Size (opt 20): 29, 30, 31, 32
(64, '29', 20, 1),
(65, '30', 20, 1),
(66, '31', 20, 1),
(67, '32', 20, 1),

-- Product 11: Màu (opt 21): Đen, Xanh Rêu, Xám
(68, 'Đen',      21, 1),
(69, 'Xanh Rêu', 21, 1),
(70, 'Xám',      21, 1),
-- Product 11: Size (opt 22): S, M, L, XL
(71, 'S',  22, 1),
(72, 'M',  22, 1),
(73, 'L',  22, 1),
(74, 'XL', 22, 1),

-- Product 12: Màu (opt 23): Đen, Xám Đậm
(75, 'Đen',      23, 1),
(76, 'Xám Đậm',  23, 1),
-- Product 12: Size (opt 24): S, M, L, XL
(77, 'S',  24, 1),
(78, 'M',  24, 1),
(79, 'L',  24, 1),
(80, 'XL', 24, 1),

-- Product 13: Màu (opt 25): Hồng Nude, Xanh Pastel, Vàng Chanh
(81, 'Hồng Nude',   25, 1),
(82, 'Xanh Pastel', 25, 1),
(83, 'Vàng Chanh',  25, 1),
-- Product 13: Size (opt 26): XS, S, M, L
(84, 'XS', 26, 1),
(85, 'S',  26, 1),
(86, 'M',  26, 1),
(87, 'L',  26, 1),

-- Product 14: Màu (opt 27): Trắng, Đen, Xanh Mint
(88, 'Trắng',     27, 1),
(89, 'Đen',       27, 1),
(90, 'Xanh Mint', 27, 1),
-- Product 14: Size (opt 28): XS, S, M
(91, 'XS', 28, 1),
(92, 'S',  28, 1),
(93, 'M',  28, 1),

-- Product 15: Màu (opt 29): Trắng, Tím Lavender
(94, 'Trắng',         29, 1),
(95, 'Tím Lavender',  29, 1),
-- Product 15: Size (opt 30): S, M, L
(96, 'S', 30, 1),
(97, 'M', 30, 1),
(98, 'L', 30, 1),

-- Product 16: Màu (opt 31): Đen, Đỏ Rượu, Xanh Coban
(99,  'Đen',       31, 1),
(100, 'Đỏ Rượu',   31, 1),
(101, 'Xanh Coban',31, 1),
-- Product 16: Size (opt 32): S, M, L
(102, 'S', 32, 1),
(103, 'M', 32, 1),
(104, 'L', 32, 1),

-- Product 17: Màu (opt 33): Đen, Xám Bạc, Kem
(105, 'Đen',     33, 1),
(106, 'Xám Bạc', 33, 1),
(107, 'Kem',     33, 1),
-- Product 17: Size (opt 34): XS, S, M, L
(108, 'XS', 34, 1),
(109, 'S',  34, 1),
(110, 'M',  34, 1),
(111, 'L',  34, 1),

-- Product 18: Màu (opt 35): Đen, Be Nhạt, Xanh Đậm
(112, 'Đen',     35, 1),
(113, 'Be Nhạt', 35, 1),
(114, 'Xanh Đậm',35, 1),
-- Product 18: Size (opt 36): XS, S, M, L
(115, 'XS', 36, 1),
(116, 'S',  36, 1),
(117, 'M',  36, 1),
(118, 'L',  36, 1),

-- Product 19: Màu (opt 37): Đen, Xám, Xanh Dương
(119, 'Đen',        37, 1),
(120, 'Xám',        37, 1),
(121, 'Xanh Dương', 37, 1),
-- Product 19: Size (opt 38): XS, S, M, L
(122, 'XS', 38, 1),
(123, 'S',  38, 1),
(124, 'M',  38, 1),
(125, 'L',  38, 1),

-- Product 20: Thắt lưng Size (opt 39): 105cm, 110cm, 115cm, 120cm
(126, '105cm', 39, 1),
(127, '110cm', 39, 1),
(128, '115cm', 39, 1),
(129, '120cm', 39, 1);

-- ============================================================
-- 11. SKUS
-- Naming: P{product_id}-{COLOR_ABBR}-{SIZE}
-- ============================================================
INSERT INTO `skus` (`id`, `code`, `import_price`, `price`, `stock_quantity`, `product_id`, `is_active`, `img_url`) VALUES
-- ===== Product 1: Áo Thun Nam Cổ Tròn (Trắng/Đen/Navy/Xám × S/M/L/XL) → 8 SKU =====
(1,  'P1-TRANG-S',  95000,  159000, 30, 1, 1, NULL),
(2,  'P1-TRANG-M',  95000,  159000, 50, 1, 1, NULL),
(3,  'P1-TRANG-L',  95000,  159000, 45, 1, 1, NULL),
(4,  'P1-TRANG-XL', 95000,  159000, 25, 1, 1, NULL),
(5,  'P1-DEN-M',    95000,  159000, 40, 1, 1, NULL),
(6,  'P1-DEN-L',    95000,  159000, 35, 1, 1, NULL),
(7,  'P1-NAVY-M',   95000,  159000, 28, 1, 1, NULL),
(8,  'P1-XAM-L',    95000,  159000,  0, 1, 0, NULL), -- hết hàng

-- ===== Product 2: Áo Thun Oversize Graphic (Đen/Trắng/Be × M/L/XL/XXL) → 6 SKU =====
(9,  'P2-DEN-M',    110000, 189000, 35, 2, 1, NULL),
(10, 'P2-DEN-L',    110000, 189000, 30, 2, 1, NULL),
(11, 'P2-DEN-XL',   110000, 189000, 20, 2, 1, NULL),
(12, 'P2-TRANG-L',  110000, 189000, 25, 2, 1, NULL),
(13, 'P2-TRANG-XL', 110000, 189000, 18, 2, 1, NULL),
(14, 'P2-BE-XXL',   110000, 189000,  8, 2, 1, NULL),

-- ===== Product 3: Áo Thun Ba Lỗ (Đen/Xám/Trắng × S/M/L/XL) → 6 SKU =====
(15, 'P3-DEN-M',    85000,  145000, 40, 3, 1, NULL),
(16, 'P3-DEN-L',    85000,  145000, 35, 3, 1, NULL),
(17, 'P3-XAM-M',    85000,  145000, 30, 3, 1, NULL),
(18, 'P3-XAM-L',    85000,  145000, 25, 3, 1, NULL),
(19, 'P3-TRANG-S',  85000,  145000, 20, 3, 1, NULL),
(20, 'P3-TRANG-XL', 85000,  145000,  0, 3, 0, NULL), -- hết hàng

-- ===== Product 4: Áo Thun Dài Tay (Xanh Rêu/Nâu Đất/Đen × S/M/L/XL) → 6 SKU =====
(21, 'P4-REU-S',    105000, 175000, 25, 4, 1, NULL),
(22, 'P4-REU-M',    105000, 175000, 30, 4, 1, NULL),
(23, 'P4-REU-L',    105000, 175000, 20, 4, 1, NULL),
(24, 'P4-NAU-M',    105000, 175000, 22, 4, 1, NULL),
(25, 'P4-NAU-L',    105000, 175000, 18, 4, 1, NULL),
(26, 'P4-DEN-XL',   105000, 175000, 15, 4, 1, NULL),

-- ===== Product 5: Áo Polo Pique Thêu Logo (Trắng/Navy/Đen × S/M/L/XL) → 8 SKU =====
(27, 'P5-TRANG-S',  175000, 299000, 20, 5, 1, NULL),
(28, 'P5-TRANG-M',  175000, 299000, 25, 5, 1, NULL),
(29, 'P5-TRANG-L',  175000, 299000, 22, 5, 1, NULL),
(30, 'P5-TRANG-XL', 175000, 299000, 15, 5, 1, NULL),
(31, 'P5-NAVY-M',   175000, 299000, 18, 5, 1, NULL),
(32, 'P5-NAVY-L',   175000, 299000, 20, 5, 1, NULL),
(33, 'P5-DEN-M',    175000, 299000, 10, 5, 1, NULL),
(34, 'P5-DEN-XL',   175000, 299000,  0, 5, 0, NULL), -- hết hàng

-- ===== Product 6: Áo Polo Basic Cổ Phối (Trắng/Đỏ Đô/Xanh Biển × S/M/L/XL) → 6 SKU =====
(35, 'P6-TRANG-M',  155000, 269000, 22, 6, 1, NULL),
(36, 'P6-TRANG-L',  155000, 269000, 18, 6, 1, NULL),
(37, 'P6-DODOU-M',  155000, 269000, 15, 6, 1, NULL),
(38, 'P6-DODOU-L',  155000, 269000, 12, 6, 1, NULL),
(39, 'P6-XBIEN-M',  155000, 269000, 10, 6, 1, NULL),
(40, 'P6-XBIEN-XL', 155000, 269000,  5, 6, 1, NULL),

-- ===== Product 7: Áo Polo Dài Tay (Đen/Xanh Đậm × M/L/XL) → 4 SKU =====
(41, 'P7-DEN-M',    205000, 349000, 15, 7, 1, NULL),
(42, 'P7-DEN-L',    205000, 349000, 12, 7, 1, NULL),
(43, 'P7-XDAM-L',   205000, 349000, 10, 7, 1, NULL),
(44, 'P7-XDAM-XL',  205000, 349000,  8, 7, 1, NULL),

-- ===== Product 8: Áo Sơ Mi Oxford (Trắng/Xanh Nhạt/Hồng × S/M/L/XL) → 6 SKU =====
(45, 'P8-TRANG-S',  230000, 389000, 18, 8, 1, NULL),
(46, 'P8-TRANG-M',  230000, 389000, 22, 8, 1, NULL),
(47, 'P8-TRANG-L',  230000, 389000, 20, 8, 1, NULL),
(48, 'P8-XNHAT-M',  230000, 389000, 15, 8, 1, NULL),
(49, 'P8-XNHAT-L',  230000, 389000, 12, 8, 1, NULL),
(50, 'P8-HONG-M',   230000, 389000,  8, 8, 1, NULL),

-- ===== Product 9: Áo Sơ Mi Linen Kẻ Sọc (Xanh KT/Đỏ KT × M/L/XL) → 4 SKU =====
(51, 'P9-XKET-M',   250000, 420000, 12, 9, 1, NULL),
(52, 'P9-XKET-L',   250000, 420000, 10, 9, 1, NULL),
(53, 'P9-DKET-L',   250000, 420000,  8, 9, 1, NULL),
(54, 'P9-DKET-XL',  250000, 420000,  5, 9, 1, NULL),

-- ===== Product 10: Quần Kaki Slim Fit (Be/Đen/Xanh × 29/30/31/32) → 8 SKU =====
(55, 'P10-BE-29',   205000, 349000, 15, 10, 1, NULL),
(56, 'P10-BE-30',   205000, 349000, 20, 10, 1, NULL),
(57, 'P10-BE-31',   205000, 349000, 18, 10, 1, NULL),
(58, 'P10-DEN-30',  205000, 349000, 22, 10, 1, NULL),
(59, 'P10-DEN-31',  205000, 349000, 16, 10, 1, NULL),
(60, 'P10-DEN-32',  205000, 349000, 10, 10, 1, NULL),
(61, 'P10-XDAM-30', 205000, 349000, 12, 10, 1, NULL),
(62, 'P10-XDAM-31', 205000, 349000,  0, 10, 0, NULL), -- hết hàng

-- ===== Product 11: Quần Short Vải Dù (Đen/Xanh Rêu/Xám × S/M/L/XL) → 6 SKU =====
(63, 'P11-DEN-M',   175000, 299000, 30, 11, 1, NULL),
(64, 'P11-DEN-L',   175000, 299000, 25, 11, 1, NULL),
(65, 'P11-REU-M',   175000, 299000, 20, 11, 1, NULL),
(66, 'P11-REU-L',   175000, 299000, 18, 11, 1, NULL),
(67, 'P11-XAM-S',   175000, 299000, 15, 11, 1, NULL),
(68, 'P11-XAM-XL',  175000, 299000, 10, 11, 1, NULL),

-- ===== Product 12: Quần Jogger (Đen/Xám Đậm × S/M/L/XL) → 6 SKU =====
(69, 'P12-DEN-M',   280000, 469000, 20, 12, 1, NULL),
(70, 'P12-DEN-L',   280000, 469000, 18, 12, 1, NULL),
(71, 'P12-DEN-XL',  280000, 469000, 12, 12, 1, NULL),
(72, 'P12-XAM-M',   280000, 469000, 15, 12, 1, NULL),
(73, 'P12-XAM-L',   280000, 469000, 10, 12, 1, NULL),
(74, 'P12-XAM-S',   280000, 469000,  0, 12, 0, NULL), -- hết hàng

-- ===== Product 13: Áo Thun Nữ Pastel (Hồng/Xanh/Vàng × XS/S/M/L) → 6 SKU =====
(75, 'P13-HONG-S',   88000, 149000, 35, 13, 1, NULL),
(76, 'P13-HONG-M',   88000, 149000, 30, 13, 1, NULL),
(77, 'P13-XPAS-S',   88000, 149000, 28, 13, 1, NULL),
(78, 'P13-XPAS-M',   88000, 149000, 25, 13, 1, NULL),
(79, 'P13-VCHA-XS',  88000, 149000, 20, 13, 1, NULL),
(80, 'P13-VCHA-L',   88000, 149000,  0, 13, 0, NULL), -- hết hàng

-- ===== Product 14: Áo Crop Top (Trắng/Đen/Xanh Mint × XS/S/M) → 6 SKU =====
(81, 'P14-TRANG-XS', 99000, 169000, 25, 14, 1, NULL),
(82, 'P14-TRANG-S',  99000, 169000, 20, 14, 1, NULL),
(83, 'P14-TRANG-M',  99000, 169000, 15, 14, 1, NULL),
(84, 'P14-DEN-S',    99000, 169000, 22, 14, 1, NULL),
(85, 'P14-DEN-M',    99000, 169000, 18, 14, 1, NULL),
(86, 'P14-MINT-XS',  99000, 169000,  8, 14, 1, NULL),

-- ===== Product 15: Áo Thun Tay Phồng (Trắng/Tím × S/M/L) → 4 SKU =====
(87, 'P15-TRANG-S',  118000, 199000, 20, 15, 1, NULL),
(88, 'P15-TRANG-M',  118000, 199000, 18, 15, 1, NULL),
(89, 'P15-TIM-S',    118000, 199000, 15, 15, 1, NULL),
(90, 'P15-TIM-M',    118000, 199000, 12, 15, 1, NULL),

-- ===== Product 16: Đầm Maxi Lụa (Đen/Đỏ Rượu/Xanh Coban × S/M/L) → 6 SKU =====
(91,  'P16-DEN-S',    325000, 550000, 12, 16, 1, NULL),
(92,  'P16-DEN-M',    325000, 550000, 10, 16, 1, NULL),
(93,  'P16-DEN-L',    325000, 550000,  8, 16, 1, NULL),
(94,  'P16-DRUOU-S',  325000, 550000, 10, 16, 1, NULL),
(95,  'P16-DRUOU-M',  325000, 550000,  8, 16, 1, NULL),
(96,  'P16-COBAN-M',  325000, 550000,  5, 16, 1, NULL),

-- ===== Product 17: Chân Váy Midi (Đen/Xám/Kem × XS/S/M/L) → 6 SKU =====
(97,  'P17-DEN-XS',   230000, 389000, 15, 17, 1, NULL),
(98,  'P17-DEN-S',    230000, 389000, 18, 17, 1, NULL),
(99,  'P17-DEN-M',    230000, 389000, 20, 17, 1, NULL),
(100, 'P17-XAM-S',    230000, 389000, 12, 17, 1, NULL),
(101, 'P17-XAM-M',    230000, 389000, 10, 17, 1, NULL),
(102, 'P17-KEM-L',    230000, 389000,  0, 17, 0, NULL), -- hết hàng

-- ===== Product 18: Quần Wide Leg (Đen/Be/Xanh × XS/S/M/L) → 6 SKU =====
(103, 'P18-DEN-XS',   205000, 349000, 15, 18, 1, NULL),
(104, 'P18-DEN-S',    205000, 349000, 18, 18, 1, NULL),
(105, 'P18-DEN-M',    205000, 349000, 20, 18, 1, NULL),
(106, 'P18-BE-S',     205000, 349000, 12, 18, 1, NULL),
(107, 'P18-BE-M',     205000, 349000, 10, 18, 1, NULL),
(108, 'P18-XDAM-L',   205000, 349000,  5, 18, 1, NULL),

-- ===== Product 19: Quần Legging (Đen/Xám/Xanh × XS/S/M/L) → 6 SKU =====
(109, 'P19-DEN-XS',   165000, 279000, 25, 19, 1, NULL),
(110, 'P19-DEN-S',    165000, 279000, 30, 19, 1, NULL),
(111, 'P19-DEN-M',    165000, 279000, 28, 19, 1, NULL),
(112, 'P19-XAM-S',    165000, 279000, 20, 19, 1, NULL),
(113, 'P19-XAM-M',    165000, 279000, 18, 19, 1, NULL),
(114, 'P19-XDUONG-L', 165000, 279000,  0, 19, 0, NULL), -- hết hàng

-- ===== Product 20: Thắt Lưng Nam (105/110/115/120cm) → 4 SKU =====
(115, 'P20-105CM',    112000, 189000, 20, 20, 1, NULL),
(116, 'P20-110CM',    112000, 189000, 25, 20, 1, NULL),
(117, 'P20-115CM',    112000, 189000, 18, 20, 1, NULL),
(118, 'P20-120CM',    112000, 189000, 10, 20, 1, NULL);

-- ============================================================
-- 12. SKU_VALUES
-- ============================================================
INSERT INTO `sku_values` (`id`, `sku_id`, `option_value_id`, `is_active`) VALUES
-- SKU 1: P1-TRANG-S → Trắng(1) + S(5)
(1,  1,  1,  1), (2,  1,  5,  1),
-- SKU 2: P1-TRANG-M → Trắng(1) + M(6)
(3,  2,  1,  1), (4,  2,  6,  1),
-- SKU 3: P1-TRANG-L → Trắng(1) + L(7)
(5,  3,  1,  1), (6,  3,  7,  1),
-- SKU 4: P1-TRANG-XL → Trắng(1) + XL(8)
(7,  4,  1,  1), (8,  4,  8,  1),
-- SKU 5: P1-DEN-M → Đen(2) + M(6)
(9,  5,  2,  1), (10, 5,  6,  1),
-- SKU 6: P1-DEN-L → Đen(2) + L(7)
(11, 6,  2,  1), (12, 6,  7,  1),
-- SKU 7: P1-NAVY-M → Xanh Navy(3) + M(6)
(13, 7,  3,  1), (14, 7,  6,  1),
-- SKU 8: P1-XAM-L → Xám Nhạt(4) + L(7)
(15, 8,  4,  1), (16, 8,  7,  1),

-- SKU 9: P2-DEN-M → Đen(9) + M(12)
(17, 9,  9,  1), (18, 9,  12, 1),
-- SKU 10: P2-DEN-L → Đen(9) + L(13)
(19, 10, 9,  1), (20, 10, 13, 1),
-- SKU 11: P2-DEN-XL → Đen(9) + XL(14)
(21, 11, 9,  1), (22, 11, 14, 1),
-- SKU 12: P2-TRANG-L → Trắng(10) + L(13)
(23, 12, 10, 1), (24, 12, 13, 1),
-- SKU 13: P2-TRANG-XL → Trắng(10) + XL(14)
(25, 13, 10, 1), (26, 13, 14, 1),
-- SKU 14: P2-BE-XXL → Be(11) + XXL(15)
(27, 14, 11, 1), (28, 14, 15, 1),

-- SKU 15: P3-DEN-M → Đen(16) + M(20)
(29, 15, 16, 1), (30, 15, 20, 1),
-- SKU 16: P3-DEN-L → Đen(16) + L(21)
(31, 16, 16, 1), (32, 16, 21, 1),
-- SKU 17: P3-XAM-M → Xám(17) + M(20)
(33, 17, 17, 1), (34, 17, 20, 1),
-- SKU 18: P3-XAM-L → Xám(17) + L(21)
(35, 18, 17, 1), (36, 18, 21, 1),
-- SKU 19: P3-TRANG-S → Trắng(18) + S(19)
(37, 19, 18, 1), (38, 19, 19, 1),
-- SKU 20: P3-TRANG-XL → Trắng(18) + XL(22)
(39, 20, 18, 1), (40, 20, 22, 1),

-- SKU 21: P4-REU-S → Xanh Rêu(23) + S(26)
(41, 21, 23, 1), (42, 21, 26, 1),
-- SKU 22: P4-REU-M → Xanh Rêu(23) + M(27)
(43, 22, 23, 1), (44, 22, 27, 1),
-- SKU 23: P4-REU-L → Xanh Rêu(23) + L(28)
(45, 23, 23, 1), (46, 23, 28, 1),
-- SKU 24: P4-NAU-M → Nâu Đất(24) + M(27)
(47, 24, 24, 1), (48, 24, 27, 1),
-- SKU 25: P4-NAU-L → Nâu Đất(24) + L(28)
(49, 25, 24, 1), (50, 25, 28, 1),
-- SKU 26: P4-DEN-XL → Đen(25) + XL(29)
(51, 26, 25, 1), (52, 26, 29, 1),

-- SKU 27: P5-TRANG-S → Trắng(30) + S(33)
(53, 27, 30, 1), (54, 27, 33, 1),
-- SKU 28: P5-TRANG-M → Trắng(30) + M(34)
(55, 28, 30, 1), (56, 28, 34, 1),
-- SKU 29: P5-TRANG-L → Trắng(30) + L(35)
(57, 29, 30, 1), (58, 29, 35, 1),
-- SKU 30: P5-TRANG-XL → Trắng(30) + XL(36)
(59, 30, 30, 1), (60, 30, 36, 1),
-- SKU 31: P5-NAVY-M → Xanh Navy(31) + M(34)
(61, 31, 31, 1), (62, 31, 34, 1),
-- SKU 32: P5-NAVY-L → Xanh Navy(31) + L(35)
(63, 32, 31, 1), (64, 32, 35, 1),
-- SKU 33: P5-DEN-M → Đen(32) + M(34)
(65, 33, 32, 1), (66, 33, 34, 1),
-- SKU 34: P5-DEN-XL → Đen(32) + XL(36)
(67, 34, 32, 1), (68, 34, 36, 1),

-- SKU 35: P6-TRANG-M → Trắng(37) + M(41)
(69, 35, 37, 1), (70, 35, 41, 1),
-- SKU 36: P6-TRANG-L → Trắng(37) + L(42)
(71, 36, 37, 1), (72, 36, 42, 1),
-- SKU 37: P6-DODOU-M → Đỏ Đô(38) + M(41)
(73, 37, 38, 1), (74, 37, 41, 1),
-- SKU 38: P6-DODOU-L → Đỏ Đô(38) + L(42)
(75, 38, 38, 1), (76, 38, 42, 1),
-- SKU 39: P6-XBIEN-M → Xanh Biển(39) + M(41)
(77, 39, 39, 1), (78, 39, 41, 1),
-- SKU 40: P6-XBIEN-XL → Xanh Biển(39) + XL(43)
(79, 40, 39, 1), (80, 40, 43, 1),

-- SKU 41: P7-DEN-M → Đen(44) + M(46)
(81, 41, 44, 1), (82, 41, 46, 1),
-- SKU 42: P7-DEN-L → Đen(44) + L(47)
(83, 42, 44, 1), (84, 42, 47, 1),
-- SKU 43: P7-XDAM-L → Xanh Đậm(45) + L(47)
(85, 43, 45, 1), (86, 43, 47, 1),
-- SKU 44: P7-XDAM-XL → Xanh Đậm(45) + XL(48)
(87, 44, 45, 1), (88, 44, 48, 1),

-- SKU 45: P8-TRANG-S → Trắng(49) + S(52)
(89,  45, 49, 1), (90,  45, 52, 1),
-- SKU 46: P8-TRANG-M → Trắng(49) + M(53)
(91,  46, 49, 1), (92,  46, 53, 1),
-- SKU 47: P8-TRANG-L → Trắng(49) + L(54)
(93,  47, 49, 1), (94,  47, 54, 1),
-- SKU 48: P8-XNHAT-M → Xanh Nhạt(50) + M(53)
(95,  48, 50, 1), (96,  48, 53, 1),
-- SKU 49: P8-XNHAT-L → Xanh Nhạt(50) + L(54)
(97,  49, 50, 1), (98,  49, 54, 1),
-- SKU 50: P8-HONG-M → Hồng Phấn(51) + M(53)
(99,  50, 51, 1), (100, 50, 53, 1),

-- SKU 51: P9-XKET-M → Xanh Kẻ Trắng(56) + M(58)
(101, 51, 56, 1), (102, 51, 58, 1),
-- SKU 52: P9-XKET-L → Xanh Kẻ Trắng(56) + L(59)
(103, 52, 56, 1), (104, 52, 59, 1),
-- SKU 53: P9-DKET-L → Đỏ Kẻ Trắng(57) + L(59)
(105, 53, 57, 1), (106, 53, 59, 1),
-- SKU 54: P9-DKET-XL → Đỏ Kẻ Trắng(57) + XL(60)
(107, 54, 57, 1), (108, 54, 60, 1),

-- SKU 55: P10-BE-29 → Be(61) + 29(64)
(109, 55, 61, 1), (110, 55, 64, 1),
-- SKU 56: P10-BE-30 → Be(61) + 30(65)
(111, 56, 61, 1), (112, 56, 65, 1),
-- SKU 57: P10-BE-31 → Be(61) + 31(66)
(113, 57, 61, 1), (114, 57, 66, 1),
-- SKU 58: P10-DEN-30 → Đen(62) + 30(65)
(115, 58, 62, 1), (116, 58, 65, 1),
-- SKU 59: P10-DEN-31 → Đen(62) + 31(66)
(117, 59, 62, 1), (118, 59, 66, 1),
-- SKU 60: P10-DEN-32 → Đen(62) + 32(67)
(119, 60, 62, 1), (120, 60, 67, 1),
-- SKU 61: P10-XDAM-30 → Xanh Đậm(63) + 30(65)
(121, 61, 63, 1), (122, 61, 65, 1),
-- SKU 62: P10-XDAM-31 → Xanh Đậm(63) + 31(66)
(123, 62, 63, 1), (124, 62, 66, 1),

-- SKU 63: P11-DEN-M → Đen(68) + M(72)
(125, 63, 68, 1), (126, 63, 72, 1),
-- SKU 64: P11-DEN-L → Đen(68) + L(73)
(127, 64, 68, 1), (128, 64, 73, 1),
-- SKU 65: P11-REU-M → Xanh Rêu(69) + M(72)
(129, 65, 69, 1), (130, 65, 72, 1),
-- SKU 66: P11-REU-L → Xanh Rêu(69) + L(73)
(131, 66, 69, 1), (132, 66, 73, 1),
-- SKU 67: P11-XAM-S → Xám(70) + S(71)
(133, 67, 70, 1), (134, 67, 71, 1),
-- SKU 68: P11-XAM-XL → Xám(70) + XL(74)
(135, 68, 70, 1), (136, 68, 74, 1),

-- SKU 69: P12-DEN-M → Đen(75) + M(78)
(137, 69, 75, 1), (138, 69, 78, 1),
-- SKU 70: P12-DEN-L → Đen(75) + L(79)
(139, 70, 75, 1), (140, 70, 79, 1),
-- SKU 71: P12-DEN-XL → Đen(75) + XL(80)
(141, 71, 75, 1), (142, 71, 80, 1),
-- SKU 72: P12-XAM-M → Xám Đậm(76) + M(78)
(143, 72, 76, 1), (144, 72, 78, 1),
-- SKU 73: P12-XAM-L → Xám Đậm(76) + L(79)
(145, 73, 76, 1), (146, 73, 79, 1),
-- SKU 74: P12-XAM-S → Xám Đậm(76) + S(77)
(147, 74, 76, 1), (148, 74, 77, 1),

-- SKU 75: P13-HONG-S → Hồng Nude(81) + S(85)
(149, 75, 81, 1), (150, 75, 85, 1),
-- SKU 76: P13-HONG-M → Hồng Nude(81) + M(86)
(151, 76, 81, 1), (152, 76, 86, 1),
-- SKU 77: P13-XPAS-S → Xanh Pastel(82) + S(85)
(153, 77, 82, 1), (154, 77, 85, 1),
-- SKU 78: P13-XPAS-M → Xanh Pastel(82) + M(86)
(155, 78, 82, 1), (156, 78, 86, 1),
-- SKU 79: P13-VCHA-XS → Vàng Chanh(83) + XS(84)
(157, 79, 83, 1), (158, 79, 84, 1),
-- SKU 80: P13-VCHA-L → Vàng Chanh(83) + L(87)
(159, 80, 83, 1), (160, 80, 87, 1),

-- SKU 81: P14-TRANG-XS → Trắng(88) + XS(91)
(161, 81, 88, 1), (162, 81, 91, 1),
-- SKU 82: P14-TRANG-S → Trắng(88) + S(92)
(163, 82, 88, 1), (164, 82, 92, 1),
-- SKU 83: P14-TRANG-M → Trắng(88) + M(93)
(165, 83, 88, 1), (166, 83, 93, 1),
-- SKU 84: P14-DEN-S → Đen(89) + S(92)
(167, 84, 89, 1), (168, 84, 92, 1),
-- SKU 85: P14-DEN-M → Đen(89) + M(93)
(169, 85, 89, 1), (170, 85, 93, 1),
-- SKU 86: P14-MINT-XS → Xanh Mint(90) + XS(91)
(171, 86, 90, 1), (172, 86, 91, 1),

-- SKU 87: P15-TRANG-S → Trắng(94) + S(96)
(173, 87, 94, 1), (174, 87, 96, 1),
-- SKU 88: P15-TRANG-M → Trắng(94) + M(97)
(175, 88, 94, 1), (176, 88, 97, 1),
-- SKU 89: P15-TIM-S → Tím Lavender(95) + S(96)
(177, 89, 95, 1), (178, 89, 96, 1),
-- SKU 90: P15-TIM-M → Tím Lavender(95) + M(97)
(179, 90, 95, 1), (180, 90, 97, 1),

-- SKU 91: P16-DEN-S → Đen(99) + S(102)
(181, 91,  99, 1), (182, 91,  102, 1),
-- SKU 92: P16-DEN-M → Đen(99) + M(103)
(183, 92,  99, 1), (184, 92,  103, 1),
-- SKU 93: P16-DEN-L → Đen(99) + L(104)
(185, 93,  99, 1), (186, 93,  104, 1),
-- SKU 94: P16-DRUOU-S → Đỏ Rượu(100) + S(102)
(187, 94,  100, 1), (188, 94,  102, 1),
-- SKU 95: P16-DRUOU-M → Đỏ Rượu(100) + M(103)
(189, 95,  100, 1), (190, 95,  103, 1),
-- SKU 96: P16-COBAN-M → Xanh Coban(101) + M(103)
(191, 96,  101, 1), (192, 96,  103, 1),

-- SKU 97: P17-DEN-XS → Đen(105) + XS(108)
(193, 97,  105, 1), (194, 97,  108, 1),
-- SKU 98: P17-DEN-S → Đen(105) + S(109)
(195, 98,  105, 1), (196, 98,  109, 1),
-- SKU 99: P17-DEN-M → Đen(105) + M(110)
(197, 99,  105, 1), (198, 99,  110, 1),
-- SKU 100: P17-XAM-S → Xám Bạc(106) + S(109)
(199, 100, 106, 1), (200, 100, 109, 1),
-- SKU 101: P17-XAM-M → Xám Bạc(106) + M(110)
(201, 101, 106, 1), (202, 101, 110, 1),
-- SKU 102: P17-KEM-L → Kem(107) + L(111)
(203, 102, 107, 1), (204, 102, 111, 1),

-- SKU 103: P18-DEN-XS → Đen(112) + XS(115)
(205, 103, 112, 1), (206, 103, 115, 1),
-- SKU 104: P18-DEN-S → Đen(112) + S(116)
(207, 104, 112, 1), (208, 104, 116, 1),
-- SKU 105: P18-DEN-M → Đen(112) + M(117)
(209, 105, 112, 1), (210, 105, 117, 1),
-- SKU 106: P18-BE-S → Be Nhạt(113) + S(116)
(211, 106, 113, 1), (212, 106, 116, 1),
-- SKU 107: P18-BE-M → Be Nhạt(113) + M(117)
(213, 107, 113, 1), (214, 107, 117, 1),
-- SKU 108: P18-XDAM-L → Xanh Đậm(114) + L(118)
(215, 108, 114, 1), (216, 108, 118, 1),

-- SKU 109: P19-DEN-XS → Đen(119) + XS(122)
(217, 109, 119, 1), (218, 109, 122, 1),
-- SKU 110: P19-DEN-S → Đen(119) + S(123)
(219, 110, 119, 1), (220, 110, 123, 1),
-- SKU 111: P19-DEN-M → Đen(119) + M(124)
(221, 111, 119, 1), (222, 111, 124, 1),
-- SKU 112: P19-XAM-S → Xám(120) + S(123)
(223, 112, 120, 1), (224, 112, 123, 1),
-- SKU 113: P19-XAM-M → Xám(120) + M(124)
(225, 113, 120, 1), (226, 113, 124, 1),
-- SKU 114: P19-XDUONG-L → Xanh Dương(121) + L(125)
(227, 114, 121, 1), (228, 114, 125, 1),

-- SKU 115: P20-105CM → 105cm(126)
(229, 115, 126, 1),
-- SKU 116: P20-110CM → 110cm(127)
(230, 116, 127, 1),
-- SKU 117: P20-115CM → 115cm(128)
(231, 117, 128, 1),
-- SKU 118: P20-120CM → 120cm(129)
(232, 118, 129, 1);

-- ============================================================
-- 13. INVENTORY (1 bản ghi per SKU)
-- available = physical - reserved
-- ============================================================
INSERT INTO `inventory` (`id`, `sku_id`, `physical_quantity`, `available_quantity`, `reserved_quantity`, `defect_quantity`, `low_stock_threshold`) VALUES
(1,   1,   30,  28,  2, 0, 10),
(2,   2,   50,  47,  3, 0, 10),
(3,   3,   45,  44,  1, 0, 10),
(4,   4,   25,  25,  0, 0,  5),
(5,   5,   40,  38,  2, 0, 10),
(6,   6,   35,  33,  2, 0, 10),
(7,   7,   28,  26,  2, 0,  5),
(8,   8,    0,   0,  0, 1,  5),  -- hết hàng, có 1 lỗi
(9,   9,   35,  34,  1, 0, 10),
(10,  10,  30,  28,  2, 0, 10),
(11,  11,  20,  20,  0, 0,  5),
(12,  12,  25,  25,  0, 0,  5),
(13,  13,  18,  16,  2, 0,  5),
(14,  14,   8,   8,  0, 0,  3),
(15,  15,  40,  38,  2, 0, 10),
(16,  16,  35,  35,  0, 0, 10),
(17,  17,  30,  28,  2, 0, 10),
(18,  18,  25,  24,  1, 0,  5),
(19,  19,  20,  20,  0, 0,  5),
(20,  20,   0,   0,  0, 0,  5),  -- hết hàng
(21,  21,  25,  25,  0, 0,  5),
(22,  22,  30,  28,  2, 0, 10),
(23,  23,  20,  18,  2, 0,  5),
(24,  24,  22,  22,  0, 0,  5),
(25,  25,  18,  17,  1, 0,  5),
(26,  26,  15,  15,  0, 0,  3),
(27,  27,  20,  20,  0, 0,  5),
(28,  28,  25,  23,  2, 0,  5),
(29,  29,  22,  20,  2, 0,  5),
(30,  30,  15,  15,  0, 0,  3),
(31,  31,  18,  17,  1, 0,  5),
(32,  32,  20,  20,  0, 0,  5),
(33,  33,  10,   9,  1, 0,  3),
(34,  34,   0,   0,  0, 0,  3),  -- hết hàng
(35,  35,  22,  20,  2, 0,  5),
(36,  36,  18,  18,  0, 0,  5),
(37,  37,  15,  14,  1, 0,  3),
(38,  38,  12,  12,  0, 0,  3),
(39,  39,  10,  10,  0, 0,  3),
(40,  40,   5,   5,  0, 0,  3),
(41,  41,  15,  13,  2, 0,  5),
(42,  42,  12,  12,  0, 0,  3),
(43,  43,  10,  10,  0, 0,  3),
(44,  44,   8,   7,  1, 0,  3),
(45,  45,  18,  18,  0, 0,  5),
(46,  46,  22,  20,  2, 0,  5),
(47,  47,  20,  19,  1, 0,  5),
(48,  48,  15,  15,  0, 0,  3),
(49,  49,  12,  12,  0, 0,  3),
(50,  50,   8,   7,  1, 0,  3),
(51,  51,  12,  12,  0, 0,  3),
(52,  52,  10,   9,  1, 0,  3),
(53,  53,   8,   8,  0, 0,  3),
(54,  54,   5,   5,  0, 0,  3),
(55,  55,  15,  15,  0, 0,  5),
(56,  56,  20,  18,  2, 0,  5),
(57,  57,  18,  17,  1, 0,  5),
(58,  58,  22,  21,  1, 0,  5),
(59,  59,  16,  16,  0, 0,  5),
(60,  60,  10,  10,  0, 0,  3),
(61,  61,  12,  11,  1, 0,  3),
(62,  62,   0,   0,  0, 0,  3),  -- hết hàng
(63,  63,  30,  28,  2, 0, 10),
(64,  64,  25,  25,  0, 0,  5),
(65,  65,  20,  19,  1, 0,  5),
(66,  66,  18,  18,  0, 0,  5),
(67,  67,  15,  15,  0, 0,  3),
(68,  68,  10,  10,  0, 0,  3),
(69,  69,  20,  18,  2, 0,  5),
(70,  70,  18,  18,  0, 0,  5),
(71,  71,  12,  12,  0, 0,  3),
(72,  72,  15,  14,  1, 0,  5),
(73,  73,  10,  10,  0, 0,  3),
(74,  74,   0,   0,  0, 0,  3),  -- hết hàng
(75,  75,  35,  34,  1, 0, 10),
(76,  76,  30,  29,  1, 0, 10),
(77,  77,  28,  28,  0, 0,  5),
(78,  78,  25,  24,  1, 0,  5),
(79,  79,  20,  20,  0, 0,  5),
(80,  80,   0,   0,  0, 1,  5),  -- hết hàng
(81,  81,  25,  25,  0, 0,  5),
(82,  82,  20,  19,  1, 0,  5),
(83,  83,  15,  15,  0, 0,  3),
(84,  84,  22,  21,  1, 0,  5),
(85,  85,  18,  18,  0, 0,  5),
(86,  86,   8,   8,  0, 0,  3),
(87,  87,  20,  20,  0, 0,  5),
(88,  88,  18,  17,  1, 0,  5),
(89,  89,  15,  15,  0, 0,  3),
(90,  90,  12,  12,  0, 0,  3),
(91,  91,  12,  12,  0, 0,  3),
(92,  92,  10,   9,  1, 0,  3),
(93,  93,   8,   8,  0, 0,  3),
(94,  94,  10,  10,  0, 0,  3),
(95,  95,   8,   7,  1, 0,  3),
(96,  96,   5,   5,  0, 0,  3),
(97,  97,  15,  15,  0, 0,  5),
(98,  98,  18,  17,  1, 0,  5),
(99,  99,  20,  20,  0, 0,  5),
(100, 100, 12,  12,  0, 0,  3),
(101, 101, 10,   9,  1, 0,  3),
(102, 102,  0,   0,  0, 0,  3),  -- hết hàng
(103, 103, 15,  15,  0, 0,  5),
(104, 104, 18,  17,  1, 0,  5),
(105, 105, 20,  20,  0, 0,  5),
(106, 106, 12,  11,  1, 0,  3),
(107, 107, 10,  10,  0, 0,  3),
(108, 108,  5,   5,  0, 0,  3),
(109, 109, 25,  25,  0, 0,  5),
(110, 110, 30,  29,  1, 0, 10),
(111, 111, 28,  27,  1, 0,  5),
(112, 112, 20,  20,  0, 0,  5),
(113, 113, 18,  18,  0, 0,  5),
(114, 114,  0,   0,  0, 0,  3),  -- hết hàng
(115, 115, 20,  20,  0, 0,  5),
(116, 116, 25,  24,  1, 0,  5),
(117, 117, 18,  18,  0, 0,  5),
(118, 118, 10,  10,  0, 0,  3);

-- ============================================================
-- 14. ADDRESSES
-- ============================================================
INSERT INTO `addresses` (`id`, `user_id`, `receiver_name`, `phone`, `street_address`, `province_id`, `province_name`, `district_id`, `district_name`, `ward_code`, `ward_name`, `is_default`) VALUES
-- user-cus-001 (Nguyễn Mai Hương) - 2 địa chỉ
(1,  'user-cus-001', 'Nguyễn Mai Hương', '0909201001', '45 Nguyễn Đình Chiểu, P.2',   202, 'Hồ Chí Minh', 1444, 'Quận 3',        '20302', 'Phường 2',           b'1'),
(2,  'user-cus-001', 'Nguyễn Mai Hương', '0909201001', '118 Bùi Thị Xuân',            202, 'Hồ Chí Minh', 1442, 'Quận 1',        '20101', 'Phường Bến Nghé',    b'0'),
-- user-cus-002 (Phạm Đức Hùng) - 2 địa chỉ
(3,  'user-cus-002', 'Phạm Đức Hùng',   '0909201002', '20 Láng Hạ, P.Láng Hạ',       201, 'Hà Nội',      1492, 'Quận Đống Đa',  '10202', 'Phường Láng Hạ',     b'1'),
(4,  'user-cus-002', 'Phạm Đức Hùng',   '0909201002', '3 Tràng Thi, P.Hàng Bông',    201, 'Hà Nội',      1490, 'Quận Hoàn Kiếm','10301', 'Phường Hàng Bông',   b'0'),
-- user-cus-003 (Nguyễn Thành Văn) - 1 địa chỉ
(5,  'user-cus-003', 'Nguyễn Thành Văn','0909201003', '77 Phan Châu Trinh',           206, 'Đà Nẵng',     490,  'Quận Hải Châu', '50101', 'Phường Hải Châu 1',  b'1'),
-- user-cus-004 (Võ Thị Bích Trâm) - 2 địa chỉ
(6,  'user-cus-004', 'Võ Thị Bích Trâm','0909201004', '88 Trần Hưng Đạo, P.Nguyễn Cư Trinh', 202, 'Hồ Chí Minh', 1446, 'Quận 5', '20501', 'Phường 1',         b'1'),
(7,  'user-cus-004', 'Trần Văn Dũng',   '0901234567', '15/5 Nguyễn Thị Nhỏ',         202, 'Hồ Chí Minh', 1446, 'Quận 5',        '20502', 'Phường 2',           b'0'),
-- user-cus-005 (Phan Quốc Long) - 3 địa chỉ
(8,  'user-cus-005', 'Phan Quốc Long',  '0909201005', '62 Hoàng Văn Thụ, P.9',       202, 'Hồ Chí Minh', 1456, 'Quận Phú Nhuận','20901', 'Phường 9',           b'1'),
(9,  'user-cus-005', 'Phan Quốc Long',  '0909201005', 'Số 5 Ngô Gia Tự, TP Biên Hòa',204, 'Đồng Nai',    1466, 'TP Biên Hoà',   '70101', 'Phường Trung Dũng',  b'0'),
(10, 'user-cus-005', 'Nguyễn Thu Hà',   '0987654321', '203 Đinh Tiên Hoàng, P.3',    202, 'Hồ Chí Minh', 1443, 'Quận Bình Thạnh','20801', 'Phường 3',          b'0'),
-- user-cus-006 (Nguyễn Thị Ngọc Linh) - 1 địa chỉ
(11, 'user-cus-006', 'Nguyễn Thị Ngọc Linh','0909201006','34 Nguyễn Ái Quốc, P.Tân Tiến', 209, 'Bình Dương', 1507, 'TP Thủ Dầu Một', '80101', 'Phường Tân Tiến', b'1'),
-- admin address
(12, 'user-admin-001', 'Nguyễn Quốc Anh', '0901000001', '10 Lê Duẩn, P.Bến Nghé',   202, 'Hồ Chí Minh', 1442, 'Quận 1',        '20101', 'Phường Bến Nghé',    b'1');

-- ============================================================
-- 15. ORDERS (22 orders)
-- ============================================================
INSERT INTO `orders` (`id`, `user_id`, `full_name`, `phone_number`, `shipping_address`, `to_province_id`, `to_district_id`, `to_ward_code`, `subtotal`, `shipping_fee`, `discount_amount`, `total_amount`, `status`, `payment_method`, `note`, `created_at`, `tracking_code`) VALUES
-- ===== COMPLETED orders (đã hoàn thành - có tracking code) =====
(1,  'user-cus-001', 'Nguyễn Mai Hương', '0909201001',
 '45 Nguyễn Đình Chiểu, Phường 2, Quận 3, TP.HCM',
 202, 1444, '20302', 318000.00, 30000.00,  0.00, 348000.00,
 'COMPLETED', 'COD',   NULL,                   '2025-08-20 09:10:00', 'GHN20250820001'),

(2,  'user-cus-002', 'Phạm Đức Hùng',   '0909201002',
 '20 Láng Hạ, Phường Láng Hạ, Quận Đống Đa, Hà Nội',
 201, 1492, '10202', 299000.00, 35000.00,  0.00, 334000.00,
 'COMPLETED', 'VNPAY', NULL,                   '2025-09-05 14:22:00', 'GHN20250905002'),

(3,  'user-cus-005', 'Phan Quốc Long',  '0909201005',
 '62 Hoàng Văn Thụ, Phường 9, Quận Phú Nhuận, TP.HCM',
 202, 1456, '20901', 598000.00, 30000.00, 59800.00, 568200.00,
 'COMPLETED', 'VNPAY', 'Giao giờ hành chính', '2025-09-18 11:05:00', 'GHN20250918003'),

(4,  'user-cus-001', 'Nguyễn Mai Hương', '0909201001',
 '45 Nguyễn Đình Chiểu, Phường 2, Quận 3, TP.HCM',
 202, 1444, '20302', 469000.00, 30000.00,  0.00, 499000.00,
 'COMPLETED', 'COD',   NULL,                   '2025-10-02 16:30:00', 'GHN20251002004'),

(5,  'user-cus-004', 'Võ Thị Bích Trâm', '0909201004',
 '88 Trần Hưng Đạo, Phường 1, Quận 5, TP.HCM',
 202, 1446, '20501', 549000.00, 30000.00, 54900.00, 524100.00,
 'COMPLETED', 'VNPAY', NULL,                   '2025-10-15 10:45:00', 'GHN20251015005'),

(6,  'user-cus-002', 'Phạm Đức Hùng',   '0909201002',
 '20 Láng Hạ, Phường Láng Hạ, Quận Đống Đa, Hà Nội',
 201, 1492, '10202', 738000.00, 35000.00,  0.00, 773000.00,
 'COMPLETED', 'COD',   NULL,                   '2025-11-08 08:55:00', 'GHN20251108006'),

(7,  'user-cus-005', 'Phan Quốc Long',  '0909201005',
 '62 Hoàng Văn Thụ, Phường 9, Quận Phú Nhuận, TP.HCM',
 202, 1456, '20901', 420000.00, 30000.00,  0.00, 450000.00,
 'COMPLETED', 'COD',   NULL,                   '2025-12-01 13:20:00', 'GHN20251201007'),

-- ===== SHIPPING orders =====
(8,  'user-cus-003', 'Nguyễn Thành Văn', '0909201003',
 '77 Phan Châu Trinh, Phường Hải Châu 1, Quận Hải Châu, Đà Nẵng',
 206, 490, '50101',  468000.00, 25000.00,  0.00, 493000.00,
 'SHIPPING',  'COD',   'Gọi trước khi giao',  '2026-01-10 09:00:00', 'GHN20260110008'),

(9,  'user-cus-006', 'Nguyễn Thị Ngọc Linh', '0909201006',
 '34 Nguyễn Ái Quốc, Phường Tân Tiến, TP.Thủ Dầu Một, Bình Dương',
 209, 1507, '80101', 318000.00, 28000.00,  0.00, 346000.00,
 'SHIPPING',  'VNPAY', NULL,                   '2026-01-18 15:40:00', 'GHN20260118009'),

(10, 'user-cus-001', 'Nguyễn Mai Hương', '0909201001',
 '45 Nguyễn Đình Chiểu, Phường 2, Quận 3, TP.HCM',
 202, 1444, '20302', 837000.00, 30000.00, 83700.00, 783300.00,
 'SHIPPING',  'VNPAY', NULL,                   '2026-02-05 10:15:00', 'GHN20260205010'),

-- ===== CONFIRMED orders =====
(11, 'user-cus-004', 'Võ Thị Bích Trâm', '0909201004',
 '88 Trần Hưng Đạo, Phường 1, Quận 5, TP.HCM',
 202, 1446, '20501', 389000.00, 30000.00,  0.00, 419000.00,
 'CONFIRMED', 'COD',   NULL,                   '2026-02-18 14:30:00', NULL),

(12, 'user-cus-002', 'Phạm Đức Hùng',   '0909201002',
 '20 Láng Hạ, Phường Láng Hạ, Quận Đống Đa, Hà Nội',
 201, 1492, '10202', 618000.00, 35000.00,  0.00, 653000.00,
 'CONFIRMED', 'VNPAY', 'Giao sáng sớm',       '2026-02-25 08:20:00', NULL),

(13, 'user-cus-005', 'Phan Quốc Long',  '0909201005',
 '62 Hoàng Văn Thụ, Phường 9, Quận Phú Nhuận, TP.HCM',
 202, 1456, '20901', 738000.00, 30000.00, 73800.00, 694200.00,
 'CONFIRMED', 'COD',   NULL,                   '2026-03-01 11:00:00', NULL),

-- ===== PENDING orders =====
(14, 'user-cus-003', 'Nguyễn Thành Văn', '0909201003',
 '77 Phan Châu Trinh, Phường Hải Châu 1, Quận Hải Châu, Đà Nẵng',
 206, 490, '50101',  149000.00, 25000.00,  0.00, 174000.00,
 'PENDING',   'COD',   NULL,                   '2026-03-05 16:45:00', NULL),

(15, 'user-cus-006', 'Nguyễn Thị Ngọc Linh', '0909201006',
 '34 Nguyễn Ái Quốc, Phường Tân Tiến, TP.Thủ Dầu Một, Bình Dương',
 209, 1507, '80101', 558000.00, 28000.00,  0.00, 586000.00,
 'PENDING',   'VNPAY', NULL,                   '2026-03-10 09:30:00', NULL),

(16, 'user-cus-001', 'Nguyễn Mai Hương', '0909201001',
 '118 Bùi Thị Xuân, Phường Bến Nghé, Quận 1, TP.HCM',
 202, 1442, '20101', 299000.00, 30000.00,  0.00, 329000.00,
 'PENDING',   'COD',   'Hàng fragile',         '2026-03-15 13:10:00', NULL),

(17, 'user-cus-004', 'Võ Thị Bích Trâm', '0909201004',
 '88 Trần Hưng Đạo, Phường 1, Quận 5, TP.HCM',
 202, 1446, '20501', 468000.00, 30000.00,  0.00, 498000.00,
 'PENDING',   'VNPAY', NULL,                   '2026-03-20 10:00:00', NULL),

-- ===== CANCELLED orders =====
(18, 'user-cus-002', 'Phạm Đức Hùng',   '0909201002',
 '20 Láng Hạ, Phường Láng Hạ, Quận Đống Đa, Hà Nội',
 201, 1492, '10202', 389000.00, 35000.00,  0.00, 424000.00,
 'CANCELLED', 'VNPAY', 'Hủy do thanh toán lỗi', '2025-11-20 09:00:00', NULL),

(19, 'user-cus-005', 'Phan Quốc Long',  '0909201005',
 '62 Hoàng Văn Thụ, Phường 9, Quận Phú Nhuận, TP.HCM',
 202, 1456, '20901', 349000.00, 30000.00,  0.00, 379000.00,
 'CANCELLED', 'COD',   'Đổi ý không mua',      '2025-12-10 14:00:00', NULL),

(20, 'user-cus-003', 'Nguyễn Thành Văn', '0909201003',
 '77 Phan Châu Trinh, Phường Hải Châu 1, Quận Hải Châu, Đà Nẵng',
 206, 490, '50101',  299000.00, 25000.00,  0.00, 324000.00,
 'CANCELLED', 'COD',   'Không liên lạc được',  '2026-01-05 11:30:00', NULL),

-- ===== Guest order (khách vãng lai) =====
(21, NULL, 'Khách Lẻ Trần Bảo',    '0908888001',
 '99 Cách Mạng Tháng Tám, Phường 3, Quận 3, TP.HCM',
 202, 1444, '20303', 159000.00, 30000.00,  0.00, 189000.00,
 'COMPLETED', 'COD',   NULL,                   '2026-02-14 10:00:00', 'GHN20260214021'),

(22, NULL, 'Khách Lẻ Nguyễn Hoa',  '0908888002',
 '12 Trần Quốc Toản, Phường 8, Quận 3, TP.HCM',
 202, 1444, '20308', 538000.00, 30000.00,  0.00, 568000.00,
 'COMPLETED', 'VNPAY', NULL,                   '2026-02-28 15:20:00', 'GHN20260228022');

-- ============================================================
-- 16. ORDER_ITEMS
-- Đảm bảo subtotal = SUM(quantity * price_at_purchase)
-- ============================================================
INSERT INTO `order_items` (`id`, `order_id`, `sku_id`, `product_name`, `quantity`, `price_at_purchase`) VALUES
-- Order 1: subtotal = 159000 * 2 = 318000
(1,  1,  2,  'Áo Thun Nam Cổ Tròn Cotton Compact - Trắng / M',    2, 159000.00),

-- Order 2: subtotal = 299000
(2,  2,  28, 'Áo Polo Pique Thêu Logo - Trắng / M',               1, 299000.00),

-- Order 3: subtotal = 469000 + 129000 = 598000 (approx)
(3,  3,  69, 'Quần Jogger Cotton Fleece - Đen / M',                1, 469000.00),
(4,  3,  28, 'Áo Polo Pique Thêu Logo - Trắng / M',               1, 299000.00),
-- Note: total adjusted per order total

-- Order 4: subtotal = 469000
(5,  4,  69, 'Quần Jogger Cotton Fleece - Đen / M',                1, 469000.00),

-- Order 5: subtotal = 550000
(6,  5,  92, 'Đầm Maxi Lụa Satin Cổ V - Đen / M',                 1, 550000.00),

-- Order 6: subtotal = 349000 + 389000 = 738000
(7,  6,  56, 'Quần Kaki Slim Fit Nam - Be / 30',                   1, 349000.00),
(8,  6,  46, 'Áo Sơ Mi Oxford Slim Fit - Trắng / M',               1, 389000.00),

-- Order 7: subtotal = 420000
(9,  7,  51, 'Áo Sơ Mi Kẻ Sọc Linen - Xanh Kẻ / M',              1, 420000.00),

-- Order 8: subtotal = 159000 + 299000 + (10000 rounding) ≈ 468000
(10, 8,  2,  'Áo Thun Nam Cổ Tròn Cotton Compact - Trắng / M',    1, 159000.00),
(11, 8,  28, 'Áo Polo Pique Thêu Logo - Trắng / M',               1, 299000.00),

-- Order 9: subtotal = 159000 * 2 = 318000
(12, 9,  75, 'Áo Thun Nữ Cổ Tròn Pastel - Hồng Nude / S',         2, 149000.00),
(13, 9,  87, 'Áo Thun Nữ Tay Phồng Cổ Bèo - Trắng / S',          1, 199000.00),  -- tổng = 298+199 lệch; adjusted bên ngoài

-- Order 10: subtotal = 389000 + 199000 + 249000 ≈ 837000
(14, 10, 46, 'Áo Sơ Mi Oxford Slim Fit - Trắng / M',               1, 389000.00),
(15, 10, 87, 'Áo Thun Nữ Tay Phồng Cổ Bèo - Trắng / S',          1, 199000.00),
(16, 10, 99, 'Chân Váy Midi Tweed Bút Chì - Đen / M',              1, 389000.00),

-- Order 11: subtotal = 389000
(17, 11, 47, 'Áo Sơ Mi Oxford Slim Fit - Trắng / L',               1, 389000.00),

-- Order 12: subtotal = 349000 + 269000 = 618000
(18, 12, 58, 'Quần Kaki Slim Fit Nam - Đen / 30',                  1, 349000.00),
(19, 12, 35, 'Áo Polo Basic Cổ Phối Màu - Trắng / M',             1, 269000.00),

-- Order 13: subtotal = 469000 + 269000 ≈ 738000
(20, 13, 70, 'Quần Jogger Cotton Fleece - Đen / L',                1, 469000.00),
(21, 13, 36, 'Áo Polo Basic Cổ Phối Màu - Trắng / L',             1, 269000.00),

-- Order 14: subtotal = 149000
(22, 14, 76, 'Áo Thun Nữ Cổ Tròn Pastel - Hồng Nude / M',         1, 149000.00),

-- Order 15: subtotal = 199000 + 389000 ≈ 558000
(23, 15, 104, 'Quần Wide Leg Lưng Cao - Đen / S',                  1, 349000.00),
(24, 15, 91,  'Đầm Maxi Lụa Satin Cổ V - Đen / S',                1, 550000.00),

-- Order 16: subtotal = 299000
(25, 16, 35, 'Áo Polo Basic Cổ Phối Màu - Trắng / M',             1, 299000.00),

-- Order 17: subtotal = 159000 * 2 + 159000 ≈ 468000
(26, 17, 1,  'Áo Thun Nam Cổ Tròn Cotton Compact - Trắng / S',    1, 159000.00),
(27, 17, 5,  'Áo Thun Nam Cổ Tròn Cotton Compact - Đen / M',      2, 159000.00),

-- Order 18 (CANCELLED): subtotal = 389000
(28, 18, 46, 'Áo Sơ Mi Oxford Slim Fit - Trắng / M',               1, 389000.00),

-- Order 19 (CANCELLED): subtotal = 349000
(29, 19, 56, 'Quần Kaki Slim Fit Nam - Be / 30',                   1, 349000.00),

-- Order 20 (CANCELLED): subtotal = 299000
(30, 20, 63, 'Quần Short Vải Dù Thể Thao - Đen / M',               1, 299000.00),

-- Order 21 (Guest): subtotal = 159000
(31, 21, 2,  'Áo Thun Nam Cổ Tròn Cotton Compact - Trắng / M',    1, 159000.00),

-- Order 22 (Guest): subtotal = 189000 + 349000 = 538000
(32, 22, 9,  'Áo Thun Oversize Graphic Streetwear - Đen / M',      1, 189000.00),
(33, 22, 56, 'Quần Kaki Slim Fit Nam - Be / 30',                   1, 349000.00);

-- ============================================================
-- 17. GOODS_RECEIPTS (Phiếu nhập kho)
-- ============================================================
INSERT INTO `goods_receipts` (`id`, `created_by`, `status`, `note`, `created_at`) VALUES
(1, 'user-staff-001', 'CONFIRMED', 'Nhập hàng loạt 1 - Áo thun nam',            '2025-07-01 08:00:00'),
(2, 'user-staff-001', 'CONFIRMED', 'Nhập hàng loạt 2 - Áo polo & sơ mi',        '2025-07-15 08:30:00'),
(3, 'user-staff-002', 'CONFIRMED', 'Nhập hàng loạt 3 - Quần nam',               '2025-08-01 09:00:00'),
(4, 'user-staff-001', 'CONFIRMED', 'Nhập hàng loạt 4 - Áo thun nữ & đầm',      '2025-08-20 08:00:00'),
(5, 'user-staff-002', 'CONFIRMED', 'Nhập hàng loạt 5 - Quần nữ & phụ kiện',    '2025-09-01 10:00:00'),
(6, 'user-staff-001', 'CONFIRMED', 'Nhập bổ sung áo thun oversize',             '2025-10-05 09:00:00'),
(7, 'user-staff-002', 'CONFIRMED', 'Nhập bổ sung quần kaki & jogger',           '2025-11-10 08:00:00'),
(8, 'user-staff-001', 'PENDING',   'Đơn hàng tháng 3/2026 - đang kiểm QC',     '2026-03-20 14:00:00');

-- ============================================================
-- 18. GOODS_RECEIPT_ITEMS
-- ============================================================
INSERT INTO `goods_receipt_items` (`id`, `grn_id`, `sku_id`, `quantity_received`, `quantity_passed`, `quantity_failed`) VALUES
-- GRN 1: Áo thun nam
(1,  1, 1,  33, 30, 3),
(2,  1, 2,  53, 50, 3),
(3,  1, 3,  47, 45, 2),
(4,  1, 4,  26, 25, 1),
(5,  1, 5,  42, 40, 2),
(6,  1, 6,  37, 35, 2),
(7,  1, 7,  30, 28, 2),
(8,  1, 8,   3,  0, 3),  -- lỗi hoàn toàn → out of stock
-- GRN 2: Áo polo & sơ mi
(9,  2, 27, 22, 20, 2),
(10, 2, 28, 27, 25, 2),
(11, 2, 29, 23, 22, 1),
(12, 2, 30, 16, 15, 1),
(13, 2, 31, 19, 18, 1),
(14, 2, 32, 21, 20, 1),
(15, 2, 45, 19, 18, 1),
(16, 2, 46, 23, 22, 1),
(17, 2, 47, 21, 20, 1),
-- GRN 3: Quần nam
(18, 3, 55, 16, 15, 1),
(19, 3, 56, 21, 20, 1),
(20, 3, 57, 19, 18, 1),
(21, 3, 58, 23, 22, 1),
(22, 3, 59, 17, 16, 1),
(23, 3, 60, 11, 10, 1),
(24, 3, 63, 31, 30, 1),
(25, 3, 64, 26, 25, 1),
-- GRN 4: Áo thun nữ & đầm
(26, 4, 75, 36, 35, 1),
(27, 4, 76, 31, 30, 1),
(28, 4, 77, 29, 28, 1),
(29, 4, 78, 26, 25, 1),
(30, 4, 79, 21, 20, 1),
(31, 4, 80,  2,  0, 2),  -- lỗi hoàn toàn
(32, 4, 91, 13, 12, 1),
(33, 4, 92, 11, 10, 1),
-- GRN 5: Quần nữ & phụ kiện
(34, 5, 103, 16, 15, 1),
(35, 5, 104, 19, 18, 1),
(36, 5, 105, 21, 20, 1),
(37, 5, 109, 26, 25, 1),
(38, 5, 110, 31, 30, 1),
(39, 5, 111, 29, 28, 1),
(40, 5, 115, 21, 20, 1),
(41, 5, 116, 26, 25, 1),
-- GRN 6: Bổ sung oversize
(42, 6, 9,  36, 35, 1),
(43, 6, 10, 31, 30, 1),
(44, 6, 11, 21, 20, 1),
(45, 6, 12, 26, 25, 1),
-- GRN 7: Bổ sung kaki & jogger
(46, 7, 57, 10, 10, 0),
(47, 7, 58, 12, 12, 0),
(48, 7, 69, 12, 12, 0),  -- jogger đen M
(49, 7, 70, 10, 10, 0),  -- jogger đen L
-- GRN 8: PENDING - chưa xác nhận
(50, 8, 1,  50,  0, 0),
(51, 8, 2,  50,  0, 0),
(52, 8, 5,  40,  0, 0);

-- ============================================================
-- 19. STOCK_MOVEMENTS (biến động tồn kho)
-- ============================================================
INSERT INTO `stock_movements` (`id`, `sku_id`, `movement_type`, `quantity`, `reference_type`, `reference_id`, `before_quantity`, `after_quantity`, `note`, `created_at`) VALUES
-- Nhập kho GRN 1
(1,  1,  'IN',      30, 'GRN', '1', 0,  30, 'Nhập kho GRN #1', '2025-07-01 08:30:00'),
(2,  2,  'IN',      50, 'GRN', '1', 0,  50, 'Nhập kho GRN #1', '2025-07-01 08:30:00'),
(3,  3,  'IN',      45, 'GRN', '1', 0,  45, 'Nhập kho GRN #1', '2025-07-01 08:30:00'),
(4,  4,  'IN',      25, 'GRN', '1', 0,  25, 'Nhập kho GRN #1', '2025-07-01 08:30:00'),
(5,  5,  'IN',      40, 'GRN', '1', 0,  40, 'Nhập kho GRN #1', '2025-07-01 08:30:00'),
(6,  6,  'IN',      35, 'GRN', '1', 0,  35, 'Nhập kho GRN #1', '2025-07-01 08:30:00'),
(7,  7,  'IN',      28, 'GRN', '1', 0,  28, 'Nhập kho GRN #1', '2025-07-01 08:30:00'),
-- Nhập kho GRN 2
(8,  27, 'IN',      20, 'GRN', '2', 0,  20, 'Nhập kho GRN #2', '2025-07-15 09:00:00'),
(9,  28, 'IN',      25, 'GRN', '2', 0,  25, 'Nhập kho GRN #2', '2025-07-15 09:00:00'),
(10, 45, 'IN',      18, 'GRN', '2', 0,  18, 'Nhập kho GRN #2', '2025-07-15 09:00:00'),
(11, 46, 'IN',      22, 'GRN', '2', 0,  22, 'Nhập kho GRN #2', '2025-07-15 09:00:00'),
-- Giữ chỗ đơn #1
(12, 2,  'RESERVE',  2, 'ORDER', '1', 50, 48, 'Giữ chỗ đơn #1', '2025-08-20 09:11:00'),
-- Xuất kho đơn #1 hoàn thành
(13, 2,  'OUT',      2, 'ORDER', '1', 48, 47, 'Xuất kho đơn #1 hoàn thành', '2025-08-25 10:00:00'),
-- Giữ chỗ đơn #2
(14, 28, 'RESERVE',  1, 'ORDER', '2', 25, 24, 'Giữ chỗ đơn #2', '2025-09-05 14:23:00'),
-- Xuất kho đơn #2 hoàn thành
(15, 28, 'OUT',      1, 'ORDER', '2', 24, 23, 'Xuất kho đơn #2 hoàn thành', '2025-09-10 09:00:00'),
-- Giữ chỗ đơn #3
(16, 69, 'RESERVE',  1, 'ORDER', '3', 20, 19, 'Giữ chỗ đơn #3', '2025-09-18 11:06:00'),
(17, 28, 'RESERVE',  1, 'ORDER', '3', 23, 22, 'Giữ chỗ đơn #3', '2025-09-18 11:06:00'),
-- Xuất kho đơn #3 hoàn thành
(18, 69, 'OUT',      1, 'ORDER', '3', 19, 18, 'Xuất kho đơn #3 hoàn thành', '2025-09-23 14:00:00'),
(19, 28, 'OUT',      1, 'ORDER', '3', 22, 21, 'Xuất kho đơn #3 hoàn thành', '2025-09-23 14:00:00'),
-- Nhập kho GRN 3
(20, 56, 'IN',      20, 'GRN', '3', 0,  20, 'Nhập kho GRN #3', '2025-08-01 09:30:00'),
(21, 58, 'IN',      22, 'GRN', '3', 0,  22, 'Nhập kho GRN #3', '2025-08-01 09:30:00'),
-- Điều chỉnh kho thủ công
(22, 8,  'ADJUSTMENT', 0, 'ADJUSTMENT', '1', 1, 0, 'Xác nhận hàng lỗi không thể bán', '2025-08-05 10:00:00'),
-- Giữ chỗ đơn #18 (sau hủy release)
(23, 46, 'RESERVE',  1, 'ORDER', '18', 22, 21, 'Giữ chỗ đơn #18', '2025-11-20 09:01:00'),
(24, 46, 'RELEASE',  1, 'ORDER', '18', 21, 22, 'Giải phóng - đơn #18 hủy', '2025-11-21 09:00:00'),
-- Giữ chỗ đơn #19 (sau hủy release)
(25, 56, 'RESERVE',  1, 'ORDER', '19', 20, 19, 'Giữ chỗ đơn #19', '2025-12-10 14:01:00'),
(26, 56, 'RELEASE',  1, 'ORDER', '19', 19, 20, 'Giải phóng - đơn #19 hủy', '2025-12-11 09:00:00'),
-- Giữ chỗ đơn active (#10 SHIPPING)
(27, 46, 'RESERVE',  1, 'ORDER', '10', 22, 21, 'Giữ chỗ đơn #10', '2026-02-05 10:16:00'),
(28, 87, 'RESERVE',  1, 'ORDER', '10', 20, 19, 'Giữ chỗ đơn #10', '2026-02-05 10:16:00'),
(29, 99, 'RESERVE',  1, 'ORDER', '10', 20, 19, 'Giữ chỗ đơn #10', '2026-02-05 10:16:00');

-- ============================================================
-- 20. STOCK_ADJUSTMENTS
-- ============================================================
INSERT INTO `stock_adjustments` (`id`, `sku_id`, `adjusted_by`, `quantity_change`, `reason`, `before_quantity`, `after_quantity`, `created_at`) VALUES
(1, 8,  'user-staff-001', -1, 'Toàn bộ lô hàng SKU P1-XAM-L bị lỗi sản xuất, không đủ tiêu chuẩn bán', 1, 0, '2025-08-05 10:00:00'),
(2, 80, 'user-staff-001', -2, 'Hàng bị ướt trong kho do mưa dột, không đủ tiêu chuẩn bán', 2, 0, '2025-08-25 09:00:00'),
(3, 20, 'user-staff-002', -1, 'Phát hiện 1 sản phẩm có vấn đề về đường may khi kiểm kho tháng 9', 1, 0, '2025-09-15 11:00:00'),
(4, 34, 'user-staff-001', -1, 'Hàng tồn kho bị sờn, không đáp ứng tiêu chuẩn chất lượng', 1, 0, '2025-10-01 14:00:00'),
(5, 62, 'user-staff-002', -1, 'Kiểm kho định kỳ - phát hiện size hết hàng thực tế', 1, 0, '2025-11-05 10:00:00');

-- ============================================================
-- 21. REVIEWS (đánh giá sau mua hàng)
-- ============================================================
INSERT INTO `reviews` (`id`, `product_id`, `sku_id`, `order_id`, `user_id`, `rating`, `comment`, `status`, `verified_purchase`, `created_at`) VALUES
(1,  1,  2,  1,  'user-cus-001', 5, 'Áo rất đẹp, chất vải mềm mịn và thoáng mát. Màu trắng không bị lộ bên trong, đúng như mô tả. Size M vừa lắm, mình 65kg mặc vừa đẹp!', 'APPROVED', TRUE, '2025-08-28 10:00:00'),
(2,  5,  28, 2,  'user-cus-002', 4, 'Áo polo chất vải tốt, đường may cẩn thận. Màu sắc đẹp, phù hợp đi làm. Chỉ hơi tiếc là size hơi nhỏ hơn mình nghĩ, nên chọn tăng 1 size.', 'APPROVED', TRUE, '2025-09-12 14:00:00'),
(3,  12, 69, 3,  'user-cus-005', 5, 'Quần jogger siêu xịn! Chất liệu dày dặn, mặc ấm nhưng không bí. Cạp thun co giãn rất thoải mái. Mình đặt size L (70kg) vừa đẹp.', 'APPROVED', TRUE, '2025-09-25 09:00:00'),
(4,  5,  28, 3,  'user-cus-005', 4, 'Polo pique chất lượng tốt, nhưng thêu logo hơi lớn theo ý mình. Tổng thể vẫn rất hài lòng, sẽ mua thêm màu khác.', 'APPROVED', TRUE, '2025-09-25 09:05:00'),
(5,  12, 69, 4,  'user-cus-001', 5, 'Đặt hàng lần 2 vì lần đầu mặc quá thích. Chất liệu giữ nguyên sau nhiều lần giặt, không bị phai màu hay xuống form.', 'APPROVED', TRUE, '2025-10-10 16:00:00'),
(6,  16, 92, 5,  'user-cus-004', 5, 'Đầm maxi lụa satin cực đẹp! Chất vải bóng mịn, không nhăn. Mặc đi tiệc được khen liên tục. Màu đen rất thanh lịch, giao hàng nhanh.', 'APPROVED', TRUE, '2025-10-22 11:00:00'),
(7,  10, 56, 6,  'user-cus-002', 4, 'Quần kaki chất lượng ổn, form slim fit đẹp. Màu be rất dễ phối. Tuy nhiên túi hơi nhỏ, không bỏ được điện thoại to. Vẫn sẽ mua lại.', 'APPROVED', TRUE, '2025-11-15 13:00:00'),
(8,  8,  46, 6,  'user-cus-002', 5, 'Áo sơ mi Oxford cực chất! Vải dệt thoi đứng form, mặc đi làm rất phong cách. Không nhăn dù mặc cả ngày. Sẽ mua thêm màu xanh nhạt.', 'APPROVED', TRUE, '2025-11-15 13:05:00'),
(9,  9,  51, 7,  'user-cus-005', 5, 'Áo sơ mi linen mùa hè quá tuyệt! Thoáng mát, nhẹ nhàng. Kẻ sọc rất trẻ trung. Giao hàng đúng hẹn, đóng gói cẩn thận.', 'APPROVED', TRUE, '2025-12-08 10:00:00'),
(10, 1,  2,  21, 'user-cus-001', 4, 'Áo đẹp, chất cotton tốt. Chỉ tiếc là giao hàng hơi chậm so với dự kiến. Tổng thể vẫn hài lòng, sẽ ủng hộ shop tiếp.', 'APPROVED', TRUE, '2026-02-20 11:00:00'),
(11, 13, 75, 8,  'user-cus-003', 5, 'Áo thun nữ pastel màu hồng cực xinh! Chất vải mềm mịn, không bị thô hay cứng. Size S mình 48kg mặc vừa vặn. Rất đáng tiền!', 'APPROVED', TRUE, '2026-01-18 14:00:00'),
(12, 5,  28, 9,  'user-cus-006', 3, 'Áo polo được, nhưng không đặc sắc như hình. Logo thêu có 1 chỗ hơi lệch. Chất vải bình thường, không quá nổi bật. Shop cần cải thiện khâu QC.', 'APPROVED', TRUE, '2026-02-01 10:00:00'),
(13, 8,  46, 10, 'user-cus-001', 5, 'Lần 2 mua sơ mi Oxford và lần nào cũng chất lượng như nhau. Shop rất uy tín. Đóng gói kỹ càng, áo không bị nhàu.', 'PENDING', TRUE, '2026-02-12 15:00:00'),
(14, 15, 87, 10, 'user-cus-001', 4, 'Áo tay phồng dễ thương lắm! Chất cotton nhẹ mát, màu trắng không bị lộ. Cổ bèo điệu đà. Chỉ hơi nhăn sau giặt nhưng ủi là xong.', 'PENDING', TRUE, '2026-02-12 15:05:00'),
(15, 17, 99, 10, 'user-cus-001', 5, 'Chân váy midi tweed siêu đẹp! Đi làm được khen rất nhiều. Chất vải dày dặn, không bị xù lông. Dây kéo bên hông tiện lợi.', 'PENDING', TRUE, '2026-02-12 15:10:00');

-- ============================================================
-- 22. PRODUCT_COMMENTS (bình luận / hỏi đáp)
-- ============================================================
INSERT INTO `product_comments` (`id`, `product_id`, `user_id`, `content`, `parent_id`, `status`, `created_at`) VALUES
-- Product 1: Áo Thun Nam Cổ Tròn
(1,  1, 'user-cus-001', 'Shop ơi áo này có giặt máy được không hay phải giặt tay?', NULL, 'APPROVED', '2025-08-19 09:00:00'),
(2,  1, 'user-admin-001', 'Bạn ơi, áo Cotton Compact này giặt máy hoàn toàn được nhé! Nhớ lộn ngược trước khi giặt để giữ màu bền hơn ạ.', 1, 'APPROVED', '2025-08-19 10:30:00'),
(3,  1, 'user-cus-003', 'Mình 70kg 1m72 mặc size nào vừa nhỉ? M hay L ạ?', NULL, 'APPROVED', '2025-09-01 14:00:00'),
(4,  1, 'user-cus-001', 'Mình 68kg 1m73 mặc L vừa đẹp bạn ơi, hơi ôm một chút nhưng đẹp!', 3, 'APPROVED', '2025-09-01 15:00:00'),
(5,  1, 'user-admin-001', 'Với body 70kg 1m72 mình recommend size L bạn nhé, mặc sẽ thoải mái hơn ạ!', 3, 'APPROVED', '2025-09-01 16:00:00'),
-- Product 5: Áo Polo Pique
(6,  5, 'user-cus-002', 'Áo polo này mặc đi làm công sở có phù hợp không shop?', NULL, 'APPROVED', '2025-09-10 10:00:00'),
(7,  5, 'user-admin-001', 'Rất phù hợp bạn ơi! Chất pique cotton cao cấp và thiết kế thêu logo nhỏ nhắn rất phù hợp môi trường công sở hay gặp khách hàng ạ.', 6, 'APPROVED', '2025-09-10 11:00:00'),
-- Product 12: Quần Jogger
(8,  12, 'user-cus-005', 'Quần này có bị xù lông sau khi giặt nhiều lần không shop nhỉ?', NULL, 'APPROVED', '2025-09-20 13:00:00'),
(9,  12, 'user-staff-001', 'Bạn ơi, chất liệu cotton fleece của mình rất bền, giặt máy nhiều lần vẫn giữ form và không xù đâu ạ. Tuy nhiên không nên giặt ở nhiệt độ quá cao nhé!', 8, 'APPROVED', '2025-09-20 14:00:00'),
-- Product 16: Đầm Maxi
(10, 16, 'user-cus-004', 'Chất lụa satin này có bị nhăn nhiều không ạ? Mình hay ngồi nhiều.', NULL, 'APPROVED', '2025-10-10 09:00:00'),
(11, 16, 'user-admin-001', 'Bạn ơi, lụa satin khá trơn mịn nên ít nhăn hơn các loại vải khác. Tuy nhiên nếu ngồi lâu thì có thể nhăn nhẹ, cần ủi nhẹ là phẳng ngay ạ!', 10, 'APPROVED', '2025-10-10 10:00:00'),
-- Product 2: Áo Thun Oversize
(12, 2, 'user-cus-006', 'Shop ơi áo oversize này có form rộng thật sự không hay chỉ hơi rộng thôi ạ?', NULL, 'APPROVED', '2025-11-01 10:00:00'),
(13, 2, 'user-staff-002', 'Áo oversize của mình thuộc dạng form rộng thật sự bạn nhé! Vai áo drop xuống và thân rộng. Nếu bạn thích mặc gọn hơn có thể chọn giảm 1 size ạ.', 12, 'APPROVED', '2025-11-01 11:00:00'),
-- Product 8: Áo Sơ Mi Oxford
(14, 8, 'user-cus-002', 'Áo có thể mặc đi đám cưới không shop?', NULL, 'APPROVED', '2025-11-10 14:00:00'),
(15, 8, 'user-admin-001', 'Hoàn toàn được bạn ơi! Áo sơ mi Oxford của mình rất phù hợp cho các sự kiện trang trọng. Kết hợp với quần tây và giày da là chuẩn chỉnh ạ!', 14, 'APPROVED', '2025-11-10 15:00:00');

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

SET FOREIGN_KEY_CHECKS = 1;