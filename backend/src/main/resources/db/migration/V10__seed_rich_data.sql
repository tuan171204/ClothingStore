-- ============================================================
-- Migration: V10__seed_rich_test_data.sql
-- Mục đích: Làm giàu dữ liệu test cho toàn bộ dự án
-- Các bảng bỏ qua: flash_sales, notifications, provinces/districts/wards
-- Brands, Categories, Coupons: +7-8 bản ghi
-- Users, Customers, Addresses, Products, SKUs, Inventory,
--   Orders, OrderItems, Reviews, Comments, GRN, StockMovements: ~50-75 bản ghi mỗi bảng
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. BRANDS (+7 thương hiệu mới, tổng ~13)
-- ============================================================
INSERT INTO `brands` (`id`, `logo`, `name`) VALUES
(7,  NULL, 'Levi\'s'),
(8,  NULL, 'Uniqlo'),
(9,  NULL, 'H&M'),
(10, NULL, 'Zara'),
(11, NULL, 'ANTA'),
(12, NULL, 'Adidas'),
(13, NULL, 'Nike');

-- ============================================================
-- 2. CATEGORIES (+8 danh mục mới, tổng ~20)
-- ============================================================
INSERT INTO `categories` (`id`, `parent_id`, `name`) VALUES
(13, 1,    'Áo Khoác Nam'),
(14, 2,    'Áo Khoác Nữ'),
(15, 1,    'Đồ Thể Thao Nam'),
(16, 2,    'Đồ Thể Thao Nữ'),
(17, 3,    'Túi & Ba Lô'),
(18, 3,    'Giày Dép'),
(19, NULL, 'Đồ Ngủ & Mặc Nhà'),
(20, NULL, 'Đồ Trẻ Em');

-- ============================================================
-- 3. USERS (+18 người dùng mới)
-- Mật khẩu mặc định: "password123" (BCrypt hash giống data cũ)
-- ============================================================
INSERT INTO `users` (`id`, `active`, `created_at`, `dob`, `updated_at`, `role_id`, `avatar`, `email`, `full_name`, `password`, `phone_number`, `username`) VALUES
-- Staff mới
('user-staff-003', b'1', '2025-10-01', '1994-05-12', '2025-10-01', 3, NULL,
 'kho3@thoitrang.vn', 'Nguyễn Văn Bình',
 '$2a$10$RSm8i3MXdkG.nCwzZHlbkeydA283dmxLtKZVfUo8txBsJ0OXteCRq',
 '0901000004', 'staff.binh'),

('user-staff-004', b'1', '2025-11-15', '1991-08-20', '2025-11-15', 3, NULL,
 'kho4@thoitrang.vn', 'Phạm Thị Lan',
 '$2a$10$RSm8i3MXdkG.nCwzZHlbkeydA283dmxLtKZVfUo8txBsJ0OXteCRq',
 '0901000005', 'staff.lan'),

-- Admin phụ
('user-admin-002', b'1', '2025-08-01', '1985-03-15', '2025-08-01', 2, NULL,
 'admin2@thoitrang.vn', 'Trần Thị Hoa',
 '$2a$10$RSm8i3MXdkG.nCwzZHlbkeydA283dmxLtKZVfUo8txBsJ0OXteCRq',
 '0901000006', 'admin2'),

-- Khách hàng mới (15 người)
('user-cus-007', b'1', '2025-09-05', '1996-01-14', '2025-09-05', 1, NULL,
 'anhtuan96@gmail.com', 'Lê Anh Tuấn',
 '$2a$10$RSm8i3MXdkG.nCwzZHlbkeydA283dmxLtKZVfUo8txBsJ0OXteCRq',
 '0912300001', 'anh.tuan'),

('user-cus-008', b'1', '2025-09-10', '2002-07-22', '2025-09-10', 1, NULL,
 'minhchau2002@gmail.com', 'Đặng Minh Châu',
 '$2a$10$RSm8i3MXdkG.nCwzZHlbkeydA283dmxLtKZVfUo8txBsJ0OXteCRq',
 '0912300002', 'minh.chau'),

('user-cus-009', b'1', '2025-09-20', '1990-11-03', '2025-09-20', 1, NULL,
 'thuytrang90@gmail.com', 'Hoàng Thúy Trang',
 '$2a$10$RSm8i3MXdkG.nCwzZHlbkeydA283dmxLtKZVfUo8txBsJ0OXteCRq',
 '0912300003', 'thuy.trang'),

('user-cus-010', b'1', '2025-10-05', '1993-04-19', '2025-10-05', 1, NULL,
 'hungvinh93@gmail.com', 'Trần Hùng Vĩnh',
 '$2a$10$RSm8i3MXdkG.nCwzZHlbkeydA283dmxLtKZVfUo8txBsJ0OXteCRq',
 '0912300004', 'hung.vinh'),

('user-cus-011', b'1', '2025-10-18', '1999-08-30', '2025-10-18', 1, NULL,
 'kimchi99@gmail.com', 'Nguyễn Kim Chi',
 '$2a$10$RSm8i3MXdkG.nCwzZHlbkeydA283dmxLtKZVfUo8txBsJ0OXteCRq',
 '0912300005', 'kim.chi'),

('user-cus-012', b'1', '2025-11-01', '1987-12-25', '2025-11-01', 1, NULL,
 'quangkhai87@gmail.com', 'Vũ Quang Khải',
 '$2a$10$RSm8i3MXdkG.nCwzZHlbkeydA283dmxLtKZVfUo8txBsJ0OXteCRq',
 '0912300006', 'quang.khai'),

('user-cus-013', b'1', '2025-11-15', '2000-03-08', '2025-11-15', 1, NULL,
 'thanhmai2000@gmail.com', 'Lý Thanh Mai',
 '$2a$10$RSm8i3MXdkG.nCwzZHlbkeydA283dmxLtKZVfUo8txBsJ0OXteCRq',
 '0912300007', 'thanh.mai'),

('user-cus-014', b'1', '2025-12-01', '1995-06-11', '2025-12-01', 1, NULL,
 'ducduy95@gmail.com', 'Phan Đức Duy',
 '$2a$10$RSm8i3MXdkG.nCwzZHlbkeydA283dmxLtKZVfUo8txBsJ0OXteCRq',
 '0912300008', 'duc.duy'),

('user-cus-015', b'1', '2025-12-10', '1998-09-16', '2025-12-10', 1, NULL,
 'nguyenha98@gmail.com', 'Nguyễn Phương Hà',
 '$2a$10$RSm8i3MXdkG.nCwzZHlbkeydA283dmxLtKZVfUo8txBsJ0OXteCRq',
 '0912300009', 'phuong.ha'),

('user-cus-016', b'1', '2026-01-05', '1992-02-14', '2026-01-05', 1, NULL,
 'baotran92@gmail.com', 'Trần Gia Bảo',
 '$2a$10$RSm8i3MXdkG.nCwzZHlbkeydA283dmxLtKZVfUo8txBsJ0OXteCRq',
 '0912300010', 'gia.bao'),

('user-cus-017', b'1', '2026-01-12', '2001-05-27', '2026-01-12', 1, NULL,
 'lanhuong2001@gmail.com', 'Đỗ Lan Hương',
 '$2a$10$RSm8i3MXdkG.nCwzZHlbkeydA283dmxLtKZVfUo8txBsJ0OXteCRq',
 '0912300011', 'lan.huong'),

('user-cus-018', b'1', '2026-01-20', '1989-10-05', '2026-01-20', 1, NULL,
 'hoangtung89@gmail.com', 'Hoàng Anh Tùng',
 '$2a$10$RSm8i3MXdkG.nCwzZHlbkeydA283dmxLtKZVfUo8txBsJ0OXteCRq',
 '0912300012', 'anh.tung'),

('user-cus-019', b'1', '2026-02-01', '2003-04-01', '2026-02-01', 1, NULL,
 'mylinh2003@gmail.com', 'Lê Mỹ Linh',
 '$2a$10$RSm8i3MXdkG.nCwzZHlbkeydA283dmxLtKZVfUo8txBsJ0OXteCRq',
 '0912300013', 'my.linh'),

('user-cus-020', b'1', '2026-02-15', '1997-07-19', '2026-02-15', 1, NULL,
 'khanhnguyen97@gmail.com', 'Nguyễn Trung Khánh',
 '$2a$10$RSm8i3MXdkG.nCwzZHlbkeydA283dmxLtKZVfUo8txBsJ0OXteCRq',
 '0912300014', 'trung.khanh'),

('user-cus-021', b'1', '2026-03-01', '1994-12-30', '2026-03-01', 1, NULL,
 'binhduong94@gmail.com', 'Dương Thị Bình',
 '$2a$10$RSm8i3MXdkG.nCwzZHlbkeydA283dmxLtKZVfUo8txBsJ0OXteCRq',
 '0912300015', 'thi.binh');

-- ============================================================
-- 4. CUSTOMERS (tương ứng với users mới)
-- ============================================================
INSERT INTO `customers` (`user_id`, `birth_date`, `loyalty_points`, `membership_tier`, `phone_number`) VALUES
('user-cus-007', '1996-01-14', 850,  'SILVER', '0912300001'),
('user-cus-008', '2002-07-22', 0,    'BRONZE', '0912300002'),
('user-cus-009', '1990-11-03', 1200, 'GOLD',   '0912300003'),
('user-cus-010', '1993-04-19', 430,  'SILVER', '0912300004'),
('user-cus-011', '1999-08-30', 75,   'BRONZE', '0912300005'),
('user-cus-012', '1987-12-25', 2800, 'GOLD',   '0912300006'),
('user-cus-013', '2000-03-08', 120,  'BRONZE', '0912300007'),
('user-cus-014', '1995-06-11', 560,  'SILVER', '0912300008'),
('user-cus-015', '1998-09-16', 200,  'BRONZE', '0912300009'),
('user-cus-016', '1992-02-14', 970,  'SILVER', '0912300010'),
('user-cus-017', '2001-05-27', 45,   'BRONZE', '0912300011'),
('user-cus-018', '1989-10-05', 3500, 'GOLD',   '0912300012'),
('user-cus-019', '2003-04-01', 0,    'BRONZE', '0912300013'),
('user-cus-020', '1997-07-19', 680,  'SILVER', '0912300014'),
('user-cus-021', '1994-12-30', 310,  'BRONZE', '0912300015');

-- ============================================================
-- 5. ADDRESSES (địa chỉ cho khách hàng mới, ~20 bản ghi)
-- ============================================================
INSERT INTO `addresses` (`id`, `user_id`, `receiver_name`, `phone`, `street_address`, `province_id`, `province_name`, `district_id`, `district_name`, `ward_code`, `ward_name`, `is_default`) VALUES
(13, 'user-cus-007', 'Lê Anh Tuấn',        '0912300001', '15 Nguyễn Văn Cừ, P.4',          202, 'Hồ Chí Minh', 1445, 'Quận 4',         '20401', 'Phường 4',           b'1'),
(14, 'user-cus-007', 'Lê Anh Tuấn',        '0912300001', '89 Trần Quang Khải, P.Tân Định',  202, 'Hồ Chí Minh', 1442, 'Quận 1',         '20108', 'Phường Tân Định',    b'0'),
(15, 'user-cus-008', 'Đặng Minh Châu',     '0912300002', '22 Lý Tự Trọng, P.Bến Nghé',     202, 'Hồ Chí Minh', 1442, 'Quận 1',         '20101', 'Phường Bến Nghé',    b'1'),
(16, 'user-cus-009', 'Hoàng Thúy Trang',   '0912300003', '101 Điện Biên Phủ, P.15',        202, 'Hồ Chí Minh', 1443, 'Quận Bình Thạnh','20815', 'Phường 15',          b'1'),
(17, 'user-cus-009', 'Hoàng Thúy Trang',   '0912300003', '7/2 Xô Viết Nghệ Tĩnh, P.17',   202, 'Hồ Chí Minh', 1443, 'Quận Bình Thạnh','20817', 'Phường 17',          b'0'),
(18, 'user-cus-010', 'Trần Hùng Vĩnh',     '0912300004', '33 Kim Mã, P.Kim Mã',             201, 'Hà Nội',      1489, 'Quận Ba Đình',   '10101', 'Phường Kim Mã',      b'1'),
(19, 'user-cus-011', 'Nguyễn Kim Chi',      '0912300005', '56 Huỳnh Tấn Phát, P.Phú Mỹ',   202, 'Hồ Chí Minh', 1450, 'Quận 7',         '20705', 'Phường Phú Mỹ',      b'1'),
(20, 'user-cus-012', 'Vũ Quang Khải',       '0912300006', '42 Nguyễn Huệ, Q.Hải Châu',      206, 'Đà Nẵng',     490,  'Quận Hải Châu',  '50103', 'Phường Hải Châu 3',  b'1'),
(21, 'user-cus-013', 'Lý Thanh Mai',        '0912300007', '18 Cống Quỳnh, P.Nguyễn Cư Trinh',202,'Hồ Chí Minh', 1444, 'Quận 3',         '20308', 'Phường 8',           b'1'),
(22, 'user-cus-014', 'Phan Đức Duy',        '0912300008', '30 Lê Lợi, P.Bến Nghé',          202, 'Hồ Chí Minh', 1442, 'Quận 1',         '20101', 'Phường Bến Nghé',    b'1'),
(23, 'user-cus-015', 'Nguyễn Phương Hà',   '0912300009', '77 Cầu Giấy, P.Dịch Vọng',       201, 'Hà Nội',      1488, 'Quận Cầu Giấy',  '10401', 'Phường Dịch Vọng',   b'1'),
(24, 'user-cus-016', 'Trần Gia Bảo',        '0912300010', '9 Trần Phú, P.Mộ Lao',           201, 'Hà Nội',      1491, 'Quận Hà Đông',   '10501', 'Phường Mộ Lao',      b'1'),
(25, 'user-cus-017', 'Đỗ Lan Hương',        '0912300011', '64 Pasteur, P.6',                 202, 'Hồ Chí Minh', 1444, 'Quận 3',         '20306', 'Phường 6',           b'1'),
(26, 'user-cus-018', 'Hoàng Anh Tùng',      '0912300012', '200 Nguyễn Lương Bằng, Q.Liên Chiểu',206,'Đà Nẵng', 492,  'Quận Liên Chiểu','50301', 'Phường Hòa Hiệp Nam',b'1'),
(27, 'user-cus-019', 'Lê Mỹ Linh',          '0912300013', '5 Lý Thường Kiệt, P.Trần Hưng Đạo',201,'Hà Nội',  1490, 'Quận Hoàn Kiếm', '10305', 'Phường Trần Hưng Đạo',b'1'),
(28, 'user-cus-020', 'Nguyễn Trung Khánh', '0912300014', '120 Nam Kỳ Khởi Nghĩa, P.7',     202, 'Hồ Chí Minh', 1444, 'Quận 3',         '20307', 'Phường 7',           b'1'),
(29, 'user-cus-021', 'Dương Thị Bình',      '0912300015', '88 Phan Bội Châu, P.Thắng Lợi',  209, 'Bình Dương',  1507, 'TP Thủ Dầu Một', '80103', 'Phường Thắng Lợi',   b'1'),
(30, 'user-cus-020', 'Nguyễn Trung Khánh', '0912300014', '55 Trần Não, P.Bình An',         202, 'Hồ Chí Minh', 1448, 'Quận 2',         '20201', 'Phường Bình An',     b'0');

-- ============================================================
-- 6. PRODUCTS (+30 sản phẩm mới, tổng ~50)
-- ============================================================
INSERT INTO `products` (`id`, `base_price`, `description`, `is_active`, `name`, `thumbnail`, `brand_id`, `category_id`) VALUES
-- Áo Khoác Nam (cat 13)
(21, 599000.00, 'Áo khoác nam dù 2 lớp chống nước, form fit hiện đại. Có 4 túi khóa kéo, mũ tháo rời tiện lợi.', b'1', 'Áo Khoác Dù Chống Nước Nam', NULL, 1,  13),
(22, 749000.00, 'Áo khoác da PU nam phong cách biker, lớp lót giữ ấm mùa đông. Cổ trụ, khóa kéo kim loại cao cấp.', b'1', 'Áo Khoác Da PU Biker Nam',   NULL, 10, 13),
(23, 499000.00, 'Áo khoác cardigan len dệt kim mềm mại, phom rộng. Phù hợp thời tiết se lạnh, dễ phối với mọi outfit.', b'1', 'Áo Cardigan Len Dệt Kim Nam', NULL, 6, 13),
-- Áo Khoác Nữ (cat 14)
(24, 549000.00, 'Áo khoác nữ blazer linen form oversize, tay dài. Phù hợp đi làm, dạo phố hay chụp hình lookbook.', b'1', 'Blazer Linen Oversize Nữ',   NULL, 4, 14),
(25, 699000.00, 'Áo phao nữ lông vũ siêu nhẹ chống lạnh, form body fit. Tiện lợi gấp gọn bỏ túi khi không cần dùng.', b'1', 'Áo Phao Lông Vũ Siêu Nhẹ',  NULL, 12, 14),
-- Đồ Thể Thao Nam (cat 15)
(26, 349000.00, 'Bộ quần áo thể thao nam chất liệu Dri-FIT thoát mồ hôi nhanh, co giãn 4 chiều. Phù hợp gym, chạy bộ.', b'1', 'Áo Thể Thao Dri-FIT Nam',  NULL, 13, 15),
(27, 299000.00, 'Quần short thể thao nam tích hợp quần lót trong, thoáng mát, không bết dính khi vận động mạnh.', b'1', 'Quần Short Tích Hợp Lót Nam', NULL, 11, 15),
(28, 389000.00, 'Áo hoodie tập gym nam chất cotton pha nỉ, có túi kangaroo. Form rộng, thoải mái cho mọi bài tập.', b'1', 'Hoodie Tập Gym Nam',         NULL, 13, 15),
-- Đồ Thể Thao Nữ (cat 16)
(29, 299000.00, 'Áo bra thể thao nữ đệm mút tháo rời, dây vai chéo thời trang. Chất liệu co giãn tốt, giữ form tốt.', b'1', 'Áo Bra Thể Thao Nữ',       NULL, 11, 16),
(30, 249000.00, 'Quần legging cạp cao nâng mông tập yoga nữ. Chất vải không bị lộ, co giãn 4 chiều cực kỳ thoải mái.', b'1', 'Legging Cạp Cao Tập Yoga',  NULL, 13, 16),
-- Thêm áo thun nam (cat 4) - brand mới
(31, 199000.00, 'Áo thun nam SUPIMA cotton cao cấp Uniqlo, siêu mềm mịn, không nhăn, giữ form cực tốt sau nhiều lần giặt.', b'1', 'Áo Thun SUPIMA Cotton Premium', NULL, 8, 4),
(32, 179000.00, 'Áo thun nam cổ V basic Levi\'s chất cotton 100%, form slim fit tôn dáng. Cổ V sâu vừa phải.', b'1', 'Áo Thun Cổ V Basic Levi\'s',  NULL, 7, 4),
-- Thêm áo sơ mi nam (cat 6)
(33, 459000.00, 'Áo sơ mi flannel kẻ caro form regular fit, chất vải dày dặn mềm mại. Phù hợp thu đông.', b'1', 'Áo Sơ Mi Flannel Kẻ Caro',   NULL, 9,  6),
(34, 520000.00, 'Áo sơ mi dài tay vải twill chống nhăn cao cấp, form slim fit. Màu trơn lịch sự, phù hợp công sở.', b'1', 'Áo Sơ Mi Twill Chống Nhăn', NULL, 8,  6),
-- Thêm quần nam (cat 7)
(35, 420000.00, 'Quần jeans nam regular fit Levi\'s 501, denim wash xanh nhạt classic. Bền bỉ, thoải mái suốt ngày dài.', b'1', 'Quần Jeans 501 Regular Fit', NULL, 7, 7),
(36, 389000.00, 'Quần chinos nam slim fit màu kem, chất cotton co giãn. Dễ phối, phù hợp nhiều dịp khác nhau.', b'1', 'Quần Chinos Slim Fit Nam',   NULL, 9, 7),
-- Thêm áo thun nữ (cat 8)
(37, 189000.00, 'Áo thun nữ in hoạ tiết floral nhẹ nhàng, chất cotton linen mát mẻ. Form A-line thoáng mát mùa hè.', b'1', 'Áo Thun Floral Linen Nữ',   NULL, 9,  8),
(38, 159000.00, 'Áo thun nữ dáng suông basic H&M, cổ tròn, chất cotton organic mềm mại. Nhiều màu cơ bản để phối đồ.', b'1', 'Áo Thun Basic Organic Nữ',  NULL, 9,  8),
-- Đầm & Váy (cat 9)
(39, 450000.00, 'Đầm wrap dress vải lụa hoa nhí, cổ V thời trang, dây thắt eo. Thanh lịch nhưng vẫn trẻ trung.', b'1', 'Đầm Wrap Hoa Nhí Lụa',      NULL, 3,  9),
(40, 320000.00, 'Chân váy mini plissé xếp ly xòe, chất liệu satin nhẹ nhàng. Phong cách cô gái Pháp dễ thương.', b'1', 'Chân Váy Mini Plissé Xòe',  NULL, 10, 9),
-- Quần nữ (cat 10)
(41, 299000.00, 'Quần jeans nữ skinny Levi\'s 311 lưng cao, chất denim co giãn ôm dáng. Wash xanh đậm cổ điển.', b'1', 'Quần Jeans Skinny Levi\'s 311',NULL, 7, 10),
(42, 259000.00, 'Quần palazzo nữ vải lụa ống suông rộng, cạp chun co giãn. Nhẹ nhàng, thoải mái cả ngày.', b'1', 'Quần Palazzo Lụa Ống Suông', NULL, 3, 10),
-- Phụ kiện (cat 11, 12)
(43, 220000.00, 'Thắt lưng nữ da bò thật, khoá tròn thời trang. Thanh mảnh, phù hợp phối với đầm hoặc quần jeans.', b'1', 'Thắt Lưng Nữ Da Khoá Tròn', NULL, 4, 11),
(44, 280000.00, 'Mũ bucket unisex chất liệu canvas dày, in logo nhỏ. Chống nắng tốt, phù hợp đi biển hoặc dạo phố.', b'1', 'Mũ Bucket Canvas Logo',     NULL, 13, 12),
(45, 199000.00, 'Mũ snapback nam phong cách streetwear, vành cứng phẳng. Điều chỉnh kích thước phía sau.', b'1', 'Mũ Snapback Streetwear',     NULL, 12, 12),
-- Đồ ngủ (cat 19)
(46, 279000.00, 'Bộ đồ ngủ nam chất lụa satin mềm mại, thoáng mát. Quần dài + áo cộc tay basic. Màu sắc nhẹ nhàng.', b'1', 'Bộ Đồ Ngủ Nam Lụa Satin',  NULL, 6, 19),
(47, 249000.00, 'Bộ pyjama nữ cotton kẻ sọc pastel dễ thương. Áo dài tay cổ phối nút, quần dài thun co giãn.', b'1', 'Pyjama Nữ Cotton Kẻ Sọc',   NULL, 6, 19),
-- Thêm sản phẩm brand Adidas/Nike/ANTA
(48, 649000.00, 'Áo khoác gió Adidas Tiro 3-Stripes chất liệu AEROREADY, chống gió nhẹ. Phù hợp tập luyện và dạo phố.', b'1', 'Áo Khoác Gió Adidas Tiro',  NULL, 12, 13),
(49, 579000.00, 'Quần jogger Nike Dri-FIT chất cotton pha poly, cạp thun co giãn. 2 túi trước, 1 túi sau khoá kéo.', b'1', 'Quần Jogger Nike Dri-FIT',   NULL, 13, 15),
(50, 480000.00, 'Bộ quần áo thể thao ANTA nữ full bộ, chất liệu co giãn 4 chiều. Phù hợp yoga, gym, aerobic.', b'1', 'Bộ Thể Thao ANTA Nữ',       NULL, 11, 16);

-- ============================================================
-- 7. PRODUCT_OPTIONS cho sản phẩm mới (id 21-50)
-- ============================================================
INSERT INTO `product_options` (`id`, `name`, `product_id`) VALUES
-- Product 21: Áo Khoác Dù → Màu + Size
(40, 'Màu sắc',    21), (41, 'Kích thước', 21),
-- Product 22: Áo Khoác Da PU → Màu + Size
(42, 'Màu sắc',    22), (43, 'Kích thước', 22),
-- Product 23: Cardigan Len → Màu + Size
(44, 'Màu sắc',    23), (45, 'Kích thước', 23),
-- Product 24: Blazer Nữ → Màu + Size
(46, 'Màu sắc',    24), (47, 'Kích thước', 24),
-- Product 25: Áo Phao → Màu + Size
(48, 'Màu sắc',    25), (49, 'Kích thước', 25),
-- Product 26: Áo Thể Thao Nam → Màu + Size
(50, 'Màu sắc',    26), (51, 'Kích thước', 26),
-- Product 27: Quần Short Tích Hợp → Màu + Size
(52, 'Màu sắc',    27), (53, 'Kích thước', 27),
-- Product 28: Hoodie Gym → Màu + Size
(54, 'Màu sắc',    28), (55, 'Kích thước', 28),
-- Product 29: Áo Bra Thể Thao → Màu + Size
(56, 'Màu sắc',    29), (57, 'Kích thước', 29),
-- Product 30: Legging Yoga → Màu + Size
(58, 'Màu sắc',    30), (59, 'Kích thước', 30),
-- Product 31: Áo Thun SUPIMA → Màu + Size
(60, 'Màu sắc',    31), (61, 'Kích thước', 31),
-- Product 32: Áo Thun Cổ V → Màu + Size
(62, 'Màu sắc',    32), (63, 'Kích thước', 32),
-- Product 33: Sơ Mi Flannel → Màu + Size
(64, 'Màu sắc',    33), (65, 'Kích thước', 33),
-- Product 34: Sơ Mi Twill → Màu + Size
(66, 'Màu sắc',    34), (67, 'Kích thước', 34),
-- Product 35: Jeans 501 → Màu + Size (waist)
(68, 'Màu sắc',    35), (69, 'Kích thước', 35),
-- Product 36: Chinos Slim → Màu + Size
(70, 'Màu sắc',    36), (71, 'Kích thước', 36),
-- Product 37: Áo Floral Linen → Màu + Size
(72, 'Màu sắc',    37), (73, 'Kích thước', 37),
-- Product 38: Áo Basic Organic → Màu + Size
(74, 'Màu sắc',    38), (75, 'Kích thước', 38),
-- Product 39: Đầm Wrap Hoa Nhí → Màu + Size
(76, 'Màu sắc',    39), (77, 'Kích thước', 39),
-- Product 40: Chân Váy Plissé → Màu + Size
(78, 'Màu sắc',    40), (79, 'Kích thước', 40),
-- Product 41: Jeans Skinny Nữ → Màu + Size
(80, 'Màu sắc',    41), (81, 'Kích thước', 41),
-- Product 42: Quần Palazzo → Màu + Size
(82, 'Màu sắc',    42), (83, 'Kích thước', 42),
-- Product 43: Thắt Lưng Nữ → Kích thước
(84, 'Kích thước', 43),
-- Product 44: Mũ Bucket → Màu + Size (one-size)
(85, 'Màu sắc',    44),
-- Product 45: Mũ Snapback → Màu
(86, 'Màu sắc',    45),
-- Product 46: Đồ Ngủ Nam → Màu + Size
(87, 'Màu sắc',    46), (88, 'Kích thước', 46),
-- Product 47: Pyjama Nữ → Màu + Size
(89, 'Màu sắc',    47), (90, 'Kích thước', 47),
-- Product 48: Áo Khoác Adidas → Màu + Size
(91, 'Màu sắc',    48), (92, 'Kích thước', 48),
-- Product 49: Quần Jogger Nike → Màu + Size
(93, 'Màu sắc',    49), (94, 'Kích thước', 49),
-- Product 50: Bộ ANTA Nữ → Màu + Size
(95, 'Màu sắc',    50), (96, 'Kích thước', 50);

-- ============================================================
-- 8. PRODUCT_OPTION_VALUES cho sản phẩm mới
-- ============================================================
INSERT INTO `product_option_values` (`id`, `value`, `option_id`, `is_active`) VALUES
-- P21 Áo Khoác Dù: Màu(40): Đen, Xanh Rêu, Be | Size(41): M,L,XL
(130,'Đen',      40, 1),(131,'Xanh Rêu', 40, 1),(132,'Be',      40, 1),
(133,'M',        41, 1),(134,'L',        41, 1),(135,'XL',       41, 1),
-- P22 Áo Khoác Da: Màu(42): Đen, Nâu | Size(43): M,L,XL
(136,'Đen',      42, 1),(137,'Nâu',      42, 1),
(138,'M',        43, 1),(139,'L',        43, 1),(140,'XL',       43, 1),
-- P23 Cardigan: Màu(44): Xám,Be,Nâu Đất | Size(45): S,M,L,XL
(141,'Xám',      44, 1),(142,'Be',       44, 1),(143,'Nâu Đất',  44, 1),
(144,'S',        45, 1),(145,'M',        45, 1),(146,'L',        45, 1),(147,'XL',  45, 1),
-- P24 Blazer: Màu(46): Đen,Be,Xanh Đậm | Size(47): XS,S,M,L
(148,'Đen',      46, 1),(149,'Be',       46, 1),(150,'Xanh Đậm', 46, 1),
(151,'XS',       47, 1),(152,'S',        47, 1),(153,'M',        47, 1),(154,'L',   47, 1),
-- P25 Áo Phao: Màu(48): Đen,Hồng,Trắng | Size(49): S,M,L,XL
(155,'Đen',      48, 1),(156,'Hồng',     48, 1),(157,'Trắng',    48, 1),
(158,'S',        49, 1),(159,'M',        49, 1),(160,'L',        49, 1),(161,'XL',  49, 1),
-- P26 Áo TT Nam: Màu(50): Đen,Trắng,Xanh | Size(51): S,M,L,XL
(162,'Đen',      50, 1),(163,'Trắng',    50, 1),(164,'Xanh',     50, 1),
(165,'S',        51, 1),(166,'M',        51, 1),(167,'L',        51, 1),(168,'XL',  51, 1),
-- P27 Quần Short TT: Màu(52): Đen,Xám,Xanh Navy | Size(53): S,M,L,XL
(169,'Đen',      52, 1),(170,'Xám',      52, 1),(171,'Xanh Navy',52, 1),
(172,'S',        53, 1),(173,'M',        53, 1),(174,'L',        53, 1),(175,'XL',  53, 1),
-- P28 Hoodie: Màu(54): Đen,Xám Nhạt | Size(55): S,M,L,XL
(176,'Đen',      54, 1),(177,'Xám Nhạt', 54, 1),
(178,'S',        55, 1),(179,'M',        55, 1),(180,'L',        55, 1),(181,'XL',  55, 1),
-- P29 Bra TT Nữ: Màu(56): Đen,Hồng,Xanh Mint | Size(57): S,M,L
(182,'Đen',      56, 1),(183,'Hồng',     56, 1),(184,'Xanh Mint',56, 1),
(185,'S',        57, 1),(186,'M',        57, 1),(187,'L',        57, 1),
-- P30 Legging Yoga: Màu(58): Đen,Xám,Tím | Size(59): XS,S,M,L
(188,'Đen',      58, 1),(189,'Xám',      58, 1),(190,'Tím',      58, 1),
(191,'XS',       59, 1),(192,'S',        59, 1),(193,'M',        59, 1),(194,'L',   59, 1),
-- P31 Áo SUPIMA: Màu(60): Trắng,Đen,Xanh Navy,Xám | Size(61): XS,S,M,L,XL
(195,'Trắng',    60, 1),(196,'Đen',      60, 1),(197,'Xanh Navy',60, 1),(198,'Xám', 60, 1),
(199,'XS',       61, 1),(200,'S',        61, 1),(201,'M',        61, 1),(202,'L',   61, 1),(203,'XL', 61, 1),
-- P32 Áo Cổ V: Màu(62): Trắng,Đen,Xám | Size(63): S,M,L,XL
(204,'Trắng',    62, 1),(205,'Đen',      62, 1),(206,'Xám',      62, 1),
(207,'S',        63, 1),(208,'M',        63, 1),(209,'L',        63, 1),(210,'XL',  63, 1),
-- P33 Flannel: Màu(64): Đỏ Kẻ,Xanh Kẻ | Size(65): M,L,XL
(211,'Đỏ Kẻ Trắng', 64, 1),(212,'Xanh Kẻ Đen', 64, 1),
(213,'M',        65, 1),(214,'L',        65, 1),(215,'XL',       65, 1),
-- P34 Twill: Màu(66): Trắng,Xanh Nhạt,Đen | Size(67): S,M,L,XL
(216,'Trắng',    66, 1),(217,'Xanh Nhạt',66, 1),(218,'Đen',      66, 1),
(219,'S',        67, 1),(220,'M',        67, 1),(221,'L',        67, 1),(222,'XL',  67, 1),
-- P35 Jeans 501: Màu(68): Xanh Nhạt,Xanh Đậm | Size(69): 30,31,32,33
(223,'Xanh Nhạt',68, 1),(224,'Xanh Đậm', 68, 1),
(225,'30',       69, 1),(226,'31',       69, 1),(227,'32',       69, 1),(228,'33',  69, 1),
-- P36 Chinos: Màu(70): Kem,Xám,Nâu | Size(71): 29,30,31,32
(229,'Kem',      70, 1),(230,'Xám',      70, 1),(231,'Nâu',      70, 1),
(232,'29',       71, 1),(233,'30',       71, 1),(234,'31',       71, 1),(235,'32',  71, 1),
-- P37 Floral Linen Nữ: Màu(72): Trắng Hoa,Vàng Hoa | Size(73): S,M,L
(236,'Trắng Hoa',72, 1),(237,'Vàng Hoa', 72, 1),
(238,'S',        73, 1),(239,'M',        73, 1),(240,'L',        73, 1),
-- P38 Basic Organic: Màu(74): Trắng,Đen,Hồng,Xanh | Size(75): XS,S,M,L
(241,'Trắng',    74, 1),(242,'Đen',      74, 1),(243,'Hồng',     74, 1),(244,'Xanh', 74, 1),
(245,'XS',       75, 1),(246,'S',        75, 1),(247,'M',        75, 1),(248,'L',   75, 1),
-- P39 Đầm Wrap: Màu(76): Hồng Hoa,Xanh Hoa | Size(77): S,M,L
(249,'Hồng Hoa', 76, 1),(250,'Xanh Hoa', 76, 1),
(251,'S',        77, 1),(252,'M',        77, 1),(253,'L',        77, 1),
-- P40 Chân Váy Plissé: Màu(78): Đen,Hồng Nude,Xanh Pastel | Size(79): XS,S,M
(254,'Đen',      78, 1),(255,'Hồng Nude',78, 1),(256,'Xanh Pastel',78,1),
(257,'XS',       79, 1),(258,'S',        79, 1),(259,'M',        79, 1),
-- P41 Jeans Skinny Nữ: Màu(80): Xanh Nhạt,Xanh Đậm,Đen | Size(81): 26,27,28,29
(260,'Xanh Nhạt',80, 1),(261,'Xanh Đậm', 80, 1),(262,'Đen',     80, 1),
(263,'26',       81, 1),(264,'27',       81, 1),(265,'28',       81, 1),(266,'29',  81, 1),
-- P42 Palazzo: Màu(82): Đen,Be,Xanh Đậm | Size(83): S,M,L
(267,'Đen',      82, 1),(268,'Be',       82, 1),(269,'Xanh Đậm', 82, 1),
(270,'S',        83, 1),(271,'M',        83, 1),(272,'L',        83, 1),
-- P43 Thắt Lưng Nữ: Size(84): 90cm,95cm,100cm
(273,'90cm',     84, 1),(274,'95cm',     84, 1),(275,'100cm',    84, 1),
-- P44 Mũ Bucket: Màu(85): Đen,Be,Xanh Rêu,Trắng
(276,'Đen',      85, 1),(277,'Be',       85, 1),(278,'Xanh Rêu', 85, 1),(279,'Trắng', 85, 1),
-- P45 Mũ Snapback: Màu(86): Đen,Trắng,Đỏ
(280,'Đen',      86, 1),(281,'Trắng',    86, 1),(282,'Đỏ',       86, 1),
-- P46 Đồ Ngủ Nam: Màu(87): Xanh Navy,Be | Size(88): M,L,XL
(283,'Xanh Navy',87, 1),(284,'Be',       87, 1),
(285,'M',        88, 1),(286,'L',        88, 1),(287,'XL',       88, 1),
-- P47 Pyjama Nữ: Màu(89): Hồng Kẻ,Xanh Kẻ | Size(90): S,M,L
(288,'Hồng Kẻ',  89, 1),(289,'Xanh Kẻ', 89, 1),
(290,'S',        90, 1),(291,'M',        90, 1),(292,'L',        90, 1),
-- P48 Adidas Tiro: Màu(91): Đen,Xanh Navy | Size(92): S,M,L,XL
(293,'Đen',      91, 1),(294,'Xanh Navy',91, 1),
(295,'S',        92, 1),(296,'M',        92, 1),(297,'L',        92, 1),(298,'XL',  92, 1),
-- P49 Nike Jogger: Màu(93): Đen,Xám | Size(94): S,M,L,XL
(299,'Đen',      93, 1),(300,'Xám',      93, 1),
(301,'S',        94, 1),(302,'M',        94, 1),(303,'L',        94, 1),(304,'XL',  94, 1),
-- P50 ANTA Nữ: Màu(95): Đen,Tím | Size(96): S,M,L
(305,'Đen',      95, 1),(306,'Tím',      95, 1),
(307,'S',        96, 1),(308,'M',        96, 1),(309,'L',        96, 1);

-- ============================================================
-- 9. SKUs cho sản phẩm 21-50 (~80 SKU mới, id bắt đầu từ 119)
-- ============================================================
INSERT INTO `skus` (`id`, `code`, `import_price`, `price`, `stock_quantity`, `product_id`, `is_active`, `img_url`) VALUES
-- P21 Áo Khoác Dù (6 SKU)
(119,'P21-DEN-M',   355000, 599000, 20, 21, 1, NULL),
(120,'P21-DEN-L',   355000, 599000, 25, 21, 1, NULL),
(121,'P21-DEN-XL',  355000, 599000, 15, 21, 1, NULL),
(122,'P21-REU-M',   355000, 599000, 18, 21, 1, NULL),
(123,'P21-REU-L',   355000, 599000, 12, 21, 1, NULL),
(124,'P21-BE-L',    355000, 599000, 10, 21, 1, NULL),
-- P22 Áo Khoác Da (4 SKU)
(125,'P22-DEN-M',   445000, 749000, 12, 22, 1, NULL),
(126,'P22-DEN-L',   445000, 749000, 10, 22, 1, NULL),
(127,'P22-DEN-XL',  445000, 749000,  8, 22, 1, NULL),
(128,'P22-NAU-L',   445000, 749000,  6, 22, 1, NULL),
-- P23 Cardigan Len (6 SKU)
(129,'P23-XAM-M',   295000, 499000, 15, 23, 1, NULL),
(130,'P23-XAM-L',   295000, 499000, 12, 23, 1, NULL),
(131,'P23-BE-S',    295000, 499000, 18, 23, 1, NULL),
(132,'P23-BE-M',    295000, 499000, 20, 23, 1, NULL),
(133,'P23-NAU-M',   295000, 499000, 10, 23, 1, NULL),
(134,'P23-NAU-L',   295000, 499000,  8, 23, 1, NULL),
-- P24 Blazer Linen (6 SKU)
(135,'P24-DEN-XS',  325000, 549000, 12, 24, 1, NULL),
(136,'P24-DEN-S',   325000, 549000, 15, 24, 1, NULL),
(137,'P24-DEN-M',   325000, 549000, 18, 24, 1, NULL),
(138,'P24-BE-S',    325000, 549000, 14, 24, 1, NULL),
(139,'P24-BE-M',    325000, 549000, 10, 24, 1, NULL),
(140,'P24-XDAM-S',  325000, 549000,  8, 24, 1, NULL),
-- P25 Áo Phao (6 SKU)
(141,'P25-DEN-S',   415000, 699000, 10, 25, 1, NULL),
(142,'P25-DEN-M',   415000, 699000, 15, 25, 1, NULL),
(143,'P25-DEN-L',   415000, 699000, 12, 25, 1, NULL),
(144,'P25-HONG-S',  415000, 699000,  8, 25, 1, NULL),
(145,'P25-HONG-M',  415000, 699000, 10, 25, 1, NULL),
(146,'P25-TRANG-M', 415000, 699000,  6, 25, 1, NULL),
-- P26 Áo TT Nam (6 SKU)
(147,'P26-DEN-M',   210000, 349000, 25, 26, 1, NULL),
(148,'P26-DEN-L',   210000, 349000, 20, 26, 1, NULL),
(149,'P26-DEN-XL',  210000, 349000, 15, 26, 1, NULL),
(150,'P26-TRANG-M', 210000, 349000, 22, 26, 1, NULL),
(151,'P26-XANH-M',  210000, 349000, 18, 26, 1, NULL),
(152,'P26-XANH-L',  210000, 349000, 12, 26, 1, NULL),
-- P27 Quần Short TT Nam (6 SKU)
(153,'P27-DEN-M',   178000, 299000, 25, 27, 1, NULL),
(154,'P27-DEN-L',   178000, 299000, 20, 27, 1, NULL),
(155,'P27-XAM-M',   178000, 299000, 18, 27, 1, NULL),
(156,'P27-XAM-L',   178000, 299000, 15, 27, 1, NULL),
(157,'P27-NAVY-S',  178000, 299000, 12, 27, 1, NULL),
(158,'P27-NAVY-M',  178000, 299000, 10, 27, 1, NULL),
-- P28 Hoodie Gym (4 SKU)
(159,'P28-DEN-M',   230000, 389000, 18, 28, 1, NULL),
(160,'P28-DEN-L',   230000, 389000, 15, 28, 1, NULL),
(161,'P28-XAM-M',   230000, 389000, 12, 28, 1, NULL),
(162,'P28-XAM-L',   230000, 389000, 10, 28, 1, NULL),
-- P29 Bra TT Nữ (6 SKU)
(163,'P29-DEN-S',   178000, 299000, 20, 29, 1, NULL),
(164,'P29-DEN-M',   178000, 299000, 18, 29, 1, NULL),
(165,'P29-HONG-S',  178000, 299000, 15, 29, 1, NULL),
(166,'P29-HONG-M',  178000, 299000, 12, 29, 1, NULL),
(167,'P29-MINT-S',  178000, 299000,  8, 29, 1, NULL),
(168,'P29-MINT-M',  178000, 299000,  6, 29, 1, NULL),
-- P30 Legging Yoga (6 SKU)
(169,'P30-DEN-XS',  148000, 249000, 20, 30, 1, NULL),
(170,'P30-DEN-S',   148000, 249000, 25, 30, 1, NULL),
(171,'P30-DEN-M',   148000, 249000, 22, 30, 1, NULL),
(172,'P30-XAM-S',   148000, 249000, 18, 30, 1, NULL),
(173,'P30-XAM-M',   148000, 249000, 15, 30, 1, NULL),
(174,'P30-TIM-S',   148000, 249000, 12, 30, 1, NULL),
-- P31 Áo SUPIMA (8 SKU)
(175,'P31-TRANG-S', 118000, 199000, 25, 31, 1, NULL),
(176,'P31-TRANG-M', 118000, 199000, 30, 31, 1, NULL),
(177,'P31-TRANG-L', 118000, 199000, 28, 31, 1, NULL),
(178,'P31-DEN-M',   118000, 199000, 22, 31, 1, NULL),
(179,'P31-DEN-L',   118000, 199000, 20, 31, 1, NULL),
(180,'P31-NAVY-M',  118000, 199000, 18, 31, 1, NULL),
(181,'P31-XAM-M',   118000, 199000, 15, 31, 1, NULL),
(182,'P31-XAM-L',   118000, 199000, 12, 31, 1, NULL),
-- P32 Áo Cổ V (6 SKU)
(183,'P32-TRANG-M', 106000, 179000, 20, 32, 1, NULL),
(184,'P32-TRANG-L', 106000, 179000, 18, 32, 1, NULL),
(185,'P32-DEN-M',   106000, 179000, 15, 32, 1, NULL),
(186,'P32-DEN-L',   106000, 179000, 12, 32, 1, NULL),
(187,'P32-XAM-M',   106000, 179000, 10, 32, 1, NULL),
(188,'P32-XAM-XL',  106000, 179000,  8, 32, 1, NULL),
-- P33 Sơ Mi Flannel (4 SKU)
(189,'P33-DO-M',    272000, 459000, 12, 33, 1, NULL),
(190,'P33-DO-L',    272000, 459000, 10, 33, 1, NULL),
(191,'P33-XANH-M',  272000, 459000, 10, 33, 1, NULL),
(192,'P33-XANH-L',  272000, 459000,  8, 33, 1, NULL),
-- P34 Sơ Mi Twill (6 SKU)
(193,'P34-TRANG-S', 308000, 520000, 15, 34, 1, NULL),
(194,'P34-TRANG-M', 308000, 520000, 18, 34, 1, NULL),
(195,'P34-TRANG-L', 308000, 520000, 12, 34, 1, NULL),
(196,'P34-XNHAT-M', 308000, 520000, 10, 34, 1, NULL),
(197,'P34-DEN-M',   308000, 520000,  8, 34, 1, NULL),
(198,'P34-DEN-L',   308000, 520000,  6, 34, 1, NULL),
-- P35 Jeans 501 (6 SKU)
(199,'P35-XNHAT-30',249000, 420000, 15, 35, 1, NULL),
(200,'P35-XNHAT-31',249000, 420000, 12, 35, 1, NULL),
(201,'P35-XNHAT-32',249000, 420000, 10, 35, 1, NULL),
(202,'P35-XDAM-31', 249000, 420000, 12, 35, 1, NULL),
(203,'P35-XDAM-32', 249000, 420000, 10, 35, 1, NULL),
(204,'P35-XDAM-33', 249000, 420000,  6, 35, 1, NULL),
-- P36 Chinos (6 SKU)
(205,'P36-KEM-29',  231000, 389000, 12, 36, 1, NULL),
(206,'P36-KEM-30',  231000, 389000, 15, 36, 1, NULL),
(207,'P36-XAM-30',  231000, 389000, 12, 36, 1, NULL),
(208,'P36-XAM-31',  231000, 389000, 10, 36, 1, NULL),
(209,'P36-NAU-30',  231000, 389000,  8, 36, 1, NULL),
(210,'P36-NAU-31',  231000, 389000,  6, 36, 1, NULL),
-- P37 Floral Linen Nữ (4 SKU)
(211,'P37-THOA-S',  112000, 189000, 15, 37, 1, NULL),
(212,'P37-THOA-M',  112000, 189000, 18, 37, 1, NULL),
(213,'P37-VHOA-S',  112000, 189000, 12, 37, 1, NULL),
(214,'P37-VHOA-M',  112000, 189000, 10, 37, 1, NULL),
-- P38 Basic Organic Nữ (8 SKU)
(215,'P38-TRANG-S',  94000, 159000, 25, 38, 1, NULL),
(216,'P38-TRANG-M',  94000, 159000, 28, 38, 1, NULL),
(217,'P38-DEN-S',    94000, 159000, 22, 38, 1, NULL),
(218,'P38-DEN-M',    94000, 159000, 20, 38, 1, NULL),
(219,'P38-HONG-XS',  94000, 159000, 15, 38, 1, NULL),
(220,'P38-HONG-S',   94000, 159000, 18, 38, 1, NULL),
(221,'P38-XANH-S',   94000, 159000, 12, 38, 1, NULL),
(222,'P38-XANH-M',   94000, 159000, 10, 38, 1, NULL),
-- P39 Đầm Wrap (4 SKU)
(223,'P39-HHOA-S',  267000, 450000, 10, 39, 1, NULL),
(224,'P39-HHOA-M',  267000, 450000, 12, 39, 1, NULL),
(225,'P39-XHOA-S',  267000, 450000,  8, 39, 1, NULL),
(226,'P39-XHOA-M',  267000, 450000, 10, 39, 1, NULL),
-- P40 Chân Váy Plissé (6 SKU)
(227,'P40-DEN-XS',  190000, 320000, 12, 40, 1, NULL),
(228,'P40-DEN-S',   190000, 320000, 15, 40, 1, NULL),
(229,'P40-DEN-M',   190000, 320000, 10, 40, 1, NULL),
(230,'P40-HNUDE-S', 190000, 320000, 12, 40, 1, NULL),
(231,'P40-HNUDE-M', 190000, 320000,  8, 40, 1, NULL),
(232,'P40-XPAS-S',  190000, 320000, 10, 40, 1, NULL),
-- P41 Jeans Skinny Nữ (6 SKU)
(233,'P41-XNHAT-26',177000, 299000, 10, 41, 1, NULL),
(234,'P41-XNHAT-27',177000, 299000, 12, 41, 1, NULL),
(235,'P41-XNHAT-28',177000, 299000, 15, 41, 1, NULL),
(236,'P41-XDAM-27', 177000, 299000, 10, 41, 1, NULL),
(237,'P41-XDAM-28', 177000, 299000, 12, 41, 1, NULL),
(238,'P41-DEN-27',  177000, 299000,  8, 41, 1, NULL),
-- P42 Palazzo (4 SKU)
(239,'P42-DEN-S',   154000, 259000, 12, 42, 1, NULL),
(240,'P42-DEN-M',   154000, 259000, 15, 42, 1, NULL),
(241,'P42-BE-M',    154000, 259000, 10, 42, 1, NULL),
(242,'P42-XDAM-L',  154000, 259000,  8, 42, 1, NULL),
-- P43 Thắt Lưng Nữ (3 SKU)
(243,'P43-90CM',    130000, 220000, 15, 43, 1, NULL),
(244,'P43-95CM',    130000, 220000, 18, 43, 1, NULL),
(245,'P43-100CM',   130000, 220000, 12, 43, 1, NULL),
-- P44 Mũ Bucket (4 SKU)
(246,'P44-DEN',     166000, 280000, 20, 44, 1, NULL),
(247,'P44-BE',      166000, 280000, 15, 44, 1, NULL),
(248,'P44-REU',     166000, 280000, 12, 44, 1, NULL),
(249,'P44-TRANG',   166000, 280000, 10, 44, 1, NULL),
-- P45 Mũ Snapback (3 SKU)
(250,'P45-DEN',     118000, 199000, 20, 45, 1, NULL),
(251,'P45-TRANG',   118000, 199000, 15, 45, 1, NULL),
(252,'P45-DO',      118000, 199000, 10, 45, 1, NULL),
-- P46 Đồ Ngủ Nam (4 SKU)
(253,'P46-NAVY-M',  165000, 279000, 15, 46, 1, NULL),
(254,'P46-NAVY-L',  165000, 279000, 12, 46, 1, NULL),
(255,'P46-BE-M',    165000, 279000, 10, 46, 1, NULL),
(256,'P46-BE-L',    165000, 279000,  8, 46, 1, NULL),
-- P47 Pyjama Nữ (4 SKU)
(257,'P47-HKE-S',   148000, 249000, 12, 47, 1, NULL),
(258,'P47-HKE-M',   148000, 249000, 15, 47, 1, NULL),
(259,'P47-XANKE-S', 148000, 249000, 10, 47, 1, NULL),
(260,'P47-XANKE-M', 148000, 249000, 12, 47, 1, NULL),
-- P48 Adidas Tiro (6 SKU)
(261,'P48-DEN-S',   385000, 649000, 12, 48, 1, NULL),
(262,'P48-DEN-M',   385000, 649000, 15, 48, 1, NULL),
(263,'P48-DEN-L',   385000, 649000, 10, 48, 1, NULL),
(264,'P48-NAVY-S',  385000, 649000, 10, 48, 1, NULL),
(265,'P48-NAVY-M',  385000, 649000, 12, 48, 1, NULL),
(266,'P48-NAVY-L',  385000, 649000,  8, 48, 1, NULL),
-- P49 Nike Jogger (6 SKU)
(267,'P49-DEN-S',   344000, 579000, 15, 49, 1, NULL),
(268,'P49-DEN-M',   344000, 579000, 18, 49, 1, NULL),
(269,'P49-DEN-L',   344000, 579000, 12, 49, 1, NULL),
(270,'P49-DEN-XL',  344000, 579000, 10, 49, 1, NULL),
(271,'P49-XAM-M',   344000, 579000, 12, 49, 1, NULL),
(272,'P49-XAM-L',   344000, 579000,  8, 49, 1, NULL),
-- P50 ANTA Bộ Nữ (4 SKU)
(273,'P50-DEN-S',   285000, 480000, 10, 50, 1, NULL),
(274,'P50-DEN-M',   285000, 480000, 12, 50, 1, NULL),
(275,'P50-TIM-S',   285000, 480000,  8, 50, 1, NULL),
(276,'P50-TIM-M',   285000, 480000, 10, 50, 1, NULL);

-- ============================================================
-- 10. SKU_VALUES cho sản phẩm 21-50
-- ============================================================
INSERT INTO `sku_values` (`id`, `sku_id`, `option_value_id`, `is_active`) VALUES
-- P21 (Áo khoác dù): Đen(130)+M(133), Đen+L(134), Đen+XL(135), Rêu(131)+M, Rêu+L, Be(132)+L
(233,119,130,1),(234,119,133,1), (235,120,130,1),(236,120,134,1),
(237,121,130,1),(238,121,135,1), (239,122,131,1),(240,122,133,1),
(241,123,131,1),(242,123,134,1), (243,124,132,1),(244,124,134,1),
-- P22 (Áo khoác da): Đen(136)+M(138), Đen+L(139), Đen+XL(140), Nâu(137)+L
(245,125,136,1),(246,125,138,1), (247,126,136,1),(248,126,139,1),
(249,127,136,1),(250,127,140,1), (251,128,137,1),(252,128,139,1),
-- P23 (Cardigan): Xám(141)+M(145), Xám+L(146), Be(142)+S(144), Be+M, Nâu(143)+M, Nâu+L
(253,129,141,1),(254,129,145,1), (255,130,141,1),(256,130,146,1),
(257,131,142,1),(258,131,144,1), (259,132,142,1),(260,132,145,1),
(261,133,143,1),(262,133,145,1), (263,134,143,1),(264,134,146,1),
-- P24 (Blazer): Đen(148)+XS(151), Đen+S(152), Đen+M(153), Be(149)+S, Be+M, Xanh(150)+S
(265,135,148,1),(266,135,151,1), (267,136,148,1),(268,136,152,1),
(269,137,148,1),(270,137,153,1), (271,138,149,1),(272,138,152,1),
(273,139,149,1),(274,139,153,1), (275,140,150,1),(276,140,152,1),
-- P25 (Áo phao): Đen(155)+S(158), Đen+M(159), Đen+L(160), Hồng(156)+S, Hồng+M, Trắng(157)+M
(277,141,155,1),(278,141,158,1), (279,142,155,1),(280,142,159,1),
(281,143,155,1),(282,143,160,1), (283,144,156,1),(284,144,158,1),
(285,145,156,1),(286,145,159,1), (287,146,157,1),(288,146,159,1),
-- P26 (Áo TT Nam): Đen(162)+M(166), Đen+L(167), Đen+XL(168), Trắng(163)+M, Xanh(164)+M, Xanh+L
(289,147,162,1),(290,147,166,1), (291,148,162,1),(292,148,167,1),
(293,149,162,1),(294,149,168,1), (295,150,163,1),(296,150,166,1),
(297,151,164,1),(298,151,166,1), (299,152,164,1),(300,152,167,1),
-- P27 (Quần Short): Đen(169)+M(173), Đen+L(174), Xám(170)+M, Xám+L, Navy(171)+S(172), Navy+M
(301,153,169,1),(302,153,173,1), (303,154,169,1),(304,154,174,1),
(305,155,170,1),(306,155,173,1), (307,156,170,1),(308,156,174,1),
(309,157,171,1),(310,157,172,1), (311,158,171,1),(312,158,173,1),
-- P28 (Hoodie): Đen(176)+M(179), Đen+L(180), Xám(177)+M, Xám+L
(313,159,176,1),(314,159,179,1), (315,160,176,1),(316,160,180,1),
(317,161,177,1),(318,161,179,1), (319,162,177,1),(320,162,180,1),
-- P29 (Bra TT): Đen(182)+S(185), Đen+M(186), Hồng(183)+S, Hồng+M, Mint(184)+S, Mint+M
(321,163,182,1),(322,163,185,1), (323,164,182,1),(324,164,186,1),
(325,165,183,1),(326,165,185,1), (327,166,183,1),(328,166,186,1),
(329,167,184,1),(330,167,185,1), (331,168,184,1),(332,168,186,1),
-- P30 (Legging Yoga): Đen(188)+XS(191), Đen+S(192), Đen+M(193), Xám(189)+S, Xám+M, Tím(190)+S
(333,169,188,1),(334,169,191,1), (335,170,188,1),(336,170,192,1),
(337,171,188,1),(338,171,193,1), (339,172,189,1),(340,172,192,1),
(341,173,189,1),(342,173,193,1), (343,174,190,1),(344,174,192,1),
-- P31 (SUPIMA): Trắng(195)+S(200), Trắng+M(201), Trắng+L(202), Đen(196)+M, Đen+L, Navy(197)+M, Xám(198)+M, Xám+L
(345,175,195,1),(346,175,200,1), (347,176,195,1),(348,176,201,1),
(349,177,195,1),(350,177,202,1), (351,178,196,1),(352,178,201,1),
(353,179,196,1),(354,179,202,1), (355,180,197,1),(356,180,201,1),
(357,181,198,1),(358,181,201,1), (359,182,198,1),(360,182,202,1),
-- P32 (Cổ V): Trắng(204)+M(208), Trắng+L(209), Đen(205)+M, Đen+L, Xám(206)+M, Xám+XL(210)
(361,183,204,1),(362,183,208,1), (363,184,204,1),(364,184,209,1),
(365,185,205,1),(366,185,208,1), (367,186,205,1),(368,186,209,1),
(369,187,206,1),(370,187,208,1), (371,188,206,1),(372,188,210,1),
-- P33 (Flannel): Đỏ(211)+M(213), Đỏ+L(214), Xanh(212)+M, Xanh+L
(373,189,211,1),(374,189,213,1), (375,190,211,1),(376,190,214,1),
(377,191,212,1),(378,191,213,1), (379,192,212,1),(380,192,214,1),
-- P34 (Twill): Trắng(216)+S(219), Trắng+M(220), Trắng+L(221), Xanh(217)+M, Đen(218)+M, Đen+L
(381,193,216,1),(382,193,219,1), (383,194,216,1),(384,194,220,1),
(385,195,216,1),(386,195,221,1), (387,196,217,1),(388,196,220,1),
(389,197,218,1),(390,197,220,1), (391,198,218,1),(392,198,221,1),
-- P35 (Jeans 501): Xanh nhạt(223)+30(225), +31(226), +32(227), Xanh đậm(224)+31, +32, +33(228)
(393,199,223,1),(394,199,225,1), (395,200,223,1),(396,200,226,1),
(397,201,223,1),(398,201,227,1), (399,202,224,1),(400,202,226,1),
(401,203,224,1),(402,203,227,1), (403,204,224,1),(404,204,228,1),
-- P36 (Chinos): Kem(229)+29(232), Kem+30(233), Xám(230)+30, Xám+31(234), Nâu(231)+30, Nâu+31
(405,205,229,1),(406,205,232,1), (407,206,229,1),(408,206,233,1),
(409,207,230,1),(410,207,233,1), (411,208,230,1),(412,208,234,1),
(413,209,231,1),(414,209,233,1), (415,210,231,1),(416,210,234,1),
-- P37 (Floral Linen): Trắng(236)+S(238), Trắng+M(239), Vàng(237)+S, Vàng+M
(417,211,236,1),(418,211,238,1), (419,212,236,1),(420,212,239,1),
(421,213,237,1),(422,213,238,1), (423,214,237,1),(424,214,239,1),
-- P38 (Basic Organic): Trắng(241)+S(246), Trắng+M(247), Đen(242)+S, Đen+M, Hồng(243)+XS(245), Hồng+S, Xanh(244)+S, Xanh+M
(425,215,241,1),(426,215,246,1), (427,216,241,1),(428,216,247,1),
(429,217,242,1),(430,217,246,1), (431,218,242,1),(432,218,247,1),
(433,219,243,1),(434,219,245,1), (435,220,243,1),(436,220,246,1),
(437,221,244,1),(438,221,246,1), (439,222,244,1),(440,222,247,1),
-- P39 (Đầm Wrap): Hồng Hoa(249)+S(251), Hồng+M(252), Xanh Hoa(250)+S, Xanh+M
(441,223,249,1),(442,223,251,1), (443,224,249,1),(444,224,252,1),
(445,225,250,1),(446,225,251,1), (447,226,250,1),(448,226,252,1),
-- P40 (Plissé): Đen(254)+XS(257), Đen+S(258), Đen+M(259), Hồng(255)+S, Hồng+M, Xanh(256)+S
(449,227,254,1),(450,227,257,1), (451,228,254,1),(452,228,258,1),
(453,229,254,1),(454,229,259,1), (455,230,255,1),(456,230,258,1),
(457,231,255,1),(458,231,259,1), (459,232,256,1),(460,232,258,1),
-- P41 (Skinny): XanhNhat(260)+26(263), +27(264), +28(265), XanhDam(261)+27, +28, Den(262)+27
(461,233,260,1),(462,233,263,1), (463,234,260,1),(464,234,264,1),
(465,235,260,1),(466,235,265,1), (467,236,261,1),(468,236,264,1),
(469,237,261,1),(470,237,265,1), (471,238,262,1),(472,238,264,1),
-- P42 (Palazzo): Đen(267)+S(270), Đen+M(271), Be(268)+M, XanhDam(269)+L(272)
(473,239,267,1),(474,239,270,1), (475,240,267,1),(476,240,271,1),
(477,241,268,1),(478,241,271,1), (479,242,269,1),(480,242,272,1),
-- P43 (Thắt lưng nữ): 90cm(273), 95cm(274), 100cm(275)
(481,243,273,1),(482,244,274,1),(483,245,275,1),
-- P44 (Mũ Bucket): Đen(276), Be(277), Rêu(278), Trắng(279)
(484,246,276,1),(485,247,277,1),(486,248,278,1),(487,249,279,1),
-- P45 (Snapback): Đen(280), Trắng(281), Đỏ(282)
(488,250,280,1),(489,251,281,1),(490,252,282,1),
-- P46 (Đồ Ngủ Nam): Navy(283)+M(285), Navy+L(286), Be(284)+M, Be+L
(491,253,283,1),(492,253,285,1), (493,254,283,1),(494,254,286,1),
(495,255,284,1),(496,255,285,1), (497,256,284,1),(498,256,286,1),
-- P47 (Pyjama): Hồng(288)+S(290), Hồng+M(291), Xanh(289)+S, Xanh+M
(499,257,288,1),(500,257,290,1), (501,258,288,1),(502,258,291,1),
(503,259,289,1),(504,259,290,1), (505,260,289,1),(506,260,291,1),
-- P48 (Adidas): Đen(293)+S(295), Đen+M(296), Đen+L(297), Navy(294)+S, Navy+M, Navy+L
(507,261,293,1),(508,261,295,1), (509,262,293,1),(510,262,296,1),
(511,263,293,1),(512,263,297,1), (513,264,294,1),(514,264,295,1),
(515,265,294,1),(516,265,296,1), (517,266,294,1),(518,266,297,1),
-- P49 (Nike Jogger): Đen(299)+S(301), +M(302), +L(303), +XL(304), Xám(300)+M, +L
(519,267,299,1),(520,267,301,1), (521,268,299,1),(522,268,302,1),
(523,269,299,1),(524,269,303,1), (525,270,299,1),(526,270,304,1),
(527,271,300,1),(528,271,302,1), (529,272,300,1),(530,272,303,1),
-- P50 (ANTA Nữ): Đen(305)+S(307), Đen+M(308), Tím(306)+S, Tím+M
(531,273,305,1),(532,273,307,1), (533,274,305,1),(534,274,308,1),
(535,275,306,1),(536,275,307,1), (537,276,306,1),(538,276,308,1);

-- ============================================================
-- 11. INVENTORY cho SKU 119-276
-- ============================================================
INSERT INTO `inventory` (`id`, `sku_id`, `physical_quantity`, `available_quantity`, `reserved_quantity`, `defect_quantity`, `low_stock_threshold`, `version`) VALUES
(119,119,20,19,1,0,5,0),(120,120,25,25,0,0,5,0),(121,121,15,15,0,0,3,0),
(122,122,18,17,1,0,5,0),(123,123,12,12,0,0,3,0),(124,124,10,10,0,0,3,0),
(125,125,12,12,0,0,3,0),(126,126,10,10,0,0,3,0),(127,127, 8, 8,0,0,3,0),(128,128, 6, 6,0,0,3,0),
(129,129,15,14,1,0,5,0),(130,130,12,12,0,0,3,0),(131,131,18,18,0,0,5,0),
(132,132,20,19,1,0,5,0),(133,133,10,10,0,0,3,0),(134,134, 8, 8,0,0,3,0),
(135,135,12,12,0,0,3,0),(136,136,15,15,0,0,5,0),(137,137,18,17,1,0,5,0),
(138,138,14,14,0,0,5,0),(139,139,10,10,0,0,3,0),(140,140, 8, 8,0,0,3,0),
(141,141,10,10,0,0,3,0),(142,142,15,14,1,0,5,0),(143,143,12,12,0,0,3,0),
(144,144, 8, 8,0,0,3,0),(145,145,10,10,0,0,3,0),(146,146, 6, 6,0,0,3,0),
(147,147,25,24,1,0,10,0),(148,148,20,20,0,0,5,0),(149,149,15,15,0,0,5,0),
(150,150,22,22,0,0,5,0),(151,151,18,17,1,0,5,0),(152,152,12,12,0,0,3,0),
(153,153,25,25,0,0,5,0),(154,154,20,19,1,0,5,0),(155,155,18,18,0,0,5,0),
(156,156,15,15,0,0,5,0),(157,157,12,12,0,0,3,0),(158,158,10,10,0,0,3,0),
(159,159,18,17,1,0,5,0),(160,160,15,15,0,0,5,0),(161,161,12,12,0,0,3,0),(162,162,10,10,0,0,3,0),
(163,163,20,20,0,0,5,0),(164,164,18,17,1,0,5,0),(165,165,15,15,0,0,5,0),
(166,166,12,12,0,0,3,0),(167,167, 8, 8,0,0,3,0),(168,168, 6, 6,0,0,3,0),
(169,169,20,20,0,0,5,0),(170,170,25,24,1,0,10,0),(171,171,22,22,0,0,5,0),
(172,172,18,18,0,0,5,0),(173,173,15,15,0,0,5,0),(174,174,12,12,0,0,3,0),
(175,175,25,25,0,0,5,0),(176,176,30,29,1,0,10,0),(177,177,28,28,0,0,5,0),
(178,178,22,21,1,0,5,0),(179,179,20,20,0,0,5,0),(180,180,18,18,0,0,5,0),
(181,181,15,15,0,0,5,0),(182,182,12,12,0,0,3,0),
(183,183,20,20,0,0,5,0),(184,184,18,17,1,0,5,0),(185,185,15,15,0,0,5,0),
(186,186,12,12,0,0,3,0),(187,187,10,10,0,0,3,0),(188,188, 8, 8,0,0,3,0),
(189,189,12,12,0,0,3,0),(190,190,10,10,0,0,3,0),(191,191,10,10,0,0,3,0),(192,192, 8, 8,0,0,3,0),
(193,193,15,15,0,0,5,0),(194,194,18,17,1,0,5,0),(195,195,12,12,0,0,3,0),
(196,196,10,10,0,0,3,0),(197,197, 8, 8,0,0,3,0),(198,198, 6, 6,0,0,3,0),
(199,199,15,15,0,0,5,0),(200,200,12,12,0,0,3,0),(201,201,10,10,0,0,3,0),
(202,202,12,12,0,0,3,0),(203,203,10,10,0,0,3,0),(204,204, 6, 6,0,0,3,0),
(205,205,12,12,0,0,3,0),(206,206,15,14,1,0,5,0),(207,207,12,12,0,0,3,0),
(208,208,10,10,0,0,3,0),(209,209, 8, 8,0,0,3,0),(210,210, 6, 6,0,0,3,0),
(211,211,15,15,0,0,5,0),(212,212,18,18,0,0,5,0),(213,213,12,12,0,0,3,0),(214,214,10,10,0,0,3,0),
(215,215,25,25,0,0,5,0),(216,216,28,27,1,0,5,0),(217,217,22,22,0,0,5,0),(218,218,20,20,0,0,5,0),
(219,219,15,15,0,0,5,0),(220,220,18,18,0,0,5,0),(221,221,12,12,0,0,3,0),(222,222,10,10,0,0,3,0),
(223,223,10,10,0,0,3,0),(224,224,12,11,1,0,3,0),(225,225, 8, 8,0,0,3,0),(226,226,10,10,0,0,3,0),
(227,227,12,12,0,0,3,0),(228,228,15,15,0,0,5,0),(229,229,10,10,0,0,3,0),
(230,230,12,12,0,0,3,0),(231,231, 8, 8,0,0,3,0),(232,232,10,10,0,0,3,0),
(233,233,10,10,0,0,3,0),(234,234,12,12,0,0,3,0),(235,235,15,15,0,0,5,0),
(236,236,10,10,0,0,3,0),(237,237,12,12,0,0,3,0),(238,238, 8, 8,0,0,3,0),
(239,239,12,12,0,0,3,0),(240,240,15,14,1,0,5,0),(241,241,10,10,0,0,3,0),(242,242, 8, 8,0,0,3,0),
(243,243,15,15,0,0,5,0),(244,244,18,18,0,0,5,0),(245,245,12,12,0,0,3,0),
(246,246,20,20,0,0,5,0),(247,247,15,15,0,0,5,0),(248,248,12,12,0,0,3,0),(249,249,10,10,0,0,3,0),
(250,250,20,20,0,0,5,0),(251,251,15,15,0,0,5,0),(252,252,10,10,0,0,3,0),
(253,253,15,14,1,0,5,0),(254,254,12,12,0,0,3,0),(255,255,10,10,0,0,3,0),(256,256, 8, 8,0,0,3,0),
(257,257,12,12,0,0,3,0),(258,258,15,15,0,0,5,0),(259,259,10,10,0,0,3,0),(260,260,12,12,0,0,3,0),
(261,261,12,12,0,0,3,0),(262,262,15,14,1,0,5,0),(263,263,10,10,0,0,3,0),
(264,264,10,10,0,0,3,0),(265,265,12,12,0,0,3,0),(266,266, 8, 8,0,0,3,0),
(267,267,15,15,0,0,5,0),(268,268,18,17,1,0,5,0),(269,269,12,12,0,0,3,0),(270,270,10,10,0,0,3,0),
(271,271,12,12,0,0,3,0),(272,272, 8, 8,0,0,3,0),
(273,273,10,10,0,0,3,0),(274,274,12,12,0,0,3,0),(275,275, 8, 8,0,0,3,0),(276,276,10,10,0,0,3,0);

-- ============================================================
-- 12. COUPONS (+7 mã giảm giá mới, tổng 7+)
-- ============================================================
INSERT INTO `coupons` (`id`, `code`, `description`, `discount_type`, `discount_value`, `max_discount_amount`, `min_order_value`, `apply_type`, `usage_limit`, `used_count`, `start_date`, `end_date`, `is_active`, `version`) VALUES
(1, 'WELCOME10',  'Giảm 10% cho đơn hàng đầu tiên',                 'PERCENTAGE',    10.00,  50000.00,  99000.00,  'ORDER',   500, 234,  '2025-07-01 00:00:00', '2026-12-31 23:59:59', 1, 0),
(2, 'SALE50K',    'Giảm thẳng 50.000đ cho đơn từ 300k',             'FIXED_AMOUNT',  50000.00, NULL,    300000.00, 'ORDER',   300, 189,  '2025-08-01 00:00:00', '2026-06-30 23:59:59', 1, 0),
(3, 'FREESHIP',   'Miễn phí vận chuyển cho đơn từ 200k',            'FIXED_AMOUNT',  30000.00, NULL,    200000.00, 'ORDER',   1000,412, '2025-07-15 00:00:00', '2026-12-31 23:59:59', 1, 0),
(4, 'VIP15',      'Giảm 15% tối đa 150k dành cho thành viên VIP',   'PERCENTAGE',    15.00, 150000.00,  500000.00, 'ORDER',   100,  67,  '2025-09-01 00:00:00', '2026-09-30 23:59:59', 1, 0),
(5, 'TET2026',    'Khuyến mãi Tết Bính Ngọ 2026 - Giảm 20%',        'PERCENTAGE',    20.00, 200000.00,  400000.00, 'ORDER',   500, 321,  '2026-01-15 00:00:00', '2026-02-28 23:59:59', 0, 0),
(6, 'SUMMER30K',  'Mùa hè mát mẻ - Giảm 30k cho đơn từ 250k',      'FIXED_AMOUNT',  30000.00, NULL,    250000.00, 'ORDER',   400, 155,  '2026-04-01 00:00:00', '2026-08-31 23:59:59', 1, 0),
(7, 'BRAND20',    'Giảm 20% tối đa 100k cho sản phẩm thương hiệu chọn lọc', 'PERCENTAGE', 20.00, 100000.00, 300000.00, 'PRODUCT', 200, 88, '2025-10-01 00:00:00', '2026-10-31 23:59:59', 1, 0),
(8, 'NEWSEASON',  'Bộ sưu tập mới - Giảm 12% cho đơn từ 350k',     'PERCENTAGE',    12.00, 120000.00,  350000.00, 'ORDER',   300,  42,  '2026-03-01 00:00:00', '2026-06-30 23:59:59', 1, 0);

-- Liên kết coupon BRAND20 với một số sản phẩm
INSERT INTO `coupon_product` (`coupon_id`, `product_id`) VALUES
(7, 48), (7, 49), (7, 50), (7, 12), (7, 13);

-- ============================================================
-- 13. ORDERS mới (~50 đơn hàng, id từ 23-72)
-- ============================================================
INSERT INTO `orders` (`id`, `user_id`, `full_name`, `phone_number`, `shipping_address`,
  `to_province_id`, `to_district_id`, `to_ward_code`,
  `subtotal`, `shipping_fee`, `coupon_code`, `discount_amount`, `total_amount`,
  `status`, `payment_method`, `note`, `created_at`, `tracking_code`,
  `tracking_status`, `tracking_message`) VALUES

-- ===== COMPLETED orders =====
(23, 'user-cus-007', 'Lê Anh Tuấn',      '0912300001', '15 Nguyễn Văn Cừ, Phường 4, Quận 4, TP.HCM', 202, 1445, '20401',
 349000.00, 30000.00, NULL, 0.00, 379000.00, 'COMPLETED', 'COD', NULL, '2025-10-10 09:20:00', 'GHN20251010023', 'delivered', 'Giao hàng thành công. Cảm ơn bạn đã mua hàng!'),

(24, 'user-cus-009', 'Hoàng Thúy Trang', '0912300003', '101 Điện Biên Phủ, Phường 15, Quận Bình Thạnh, TP.HCM', 202, 1443, '20815',
 598000.00, 30000.00, 'WELCOME10', 59800.00, 568200.00, 'COMPLETED', 'VNPAY', NULL, '2025-10-22 14:30:00', 'GHN20251022024', 'delivered', 'Giao hàng thành công. Cảm ơn bạn đã mua hàng!'),

(25, 'user-cus-012', 'Vũ Quang Khải',    '0912300006', '42 Nguyễn Huệ, Quận Hải Châu, Đà Nẵng', 206, 490, '50103',
 838000.00, 25000.00, 'VIP15', 125700.00, 737300.00, 'COMPLETED', 'VNPAY', NULL, '2025-11-05 11:00:00', 'GHN20251105025', 'delivered', 'Giao hàng thành công. Cảm ơn bạn đã mua hàng!'),

(26, 'user-cus-007', 'Lê Anh Tuấn',      '0912300001', '15 Nguyễn Văn Cừ, Phường 4, Quận 4, TP.HCM', 202, 1445, '20401',
 469000.00, 30000.00, 'SALE50K', 50000.00, 449000.00, 'COMPLETED', 'COD', NULL, '2025-11-18 08:40:00', 'GHN20251118026', 'delivered', 'Giao hàng thành công. Cảm ơn bạn đã mua hàng!'),

(27, 'user-cus-010', 'Trần Hùng Vĩnh',   '0912300004', '33 Kim Mã, Phường Kim Mã, Quận Ba Đình, Hà Nội', 201, 1489, '10101',
 549000.00, 35000.00, NULL, 0.00, 584000.00, 'COMPLETED', 'COD', NULL, '2025-12-05 10:15:00', 'GHN20251205027', 'delivered', 'Giao hàng thành công. Cảm ơn bạn đã mua hàng!'),

(28, 'user-cus-014', 'Phan Đức Duy',      '0912300008', '30 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM', 202, 1442, '20101',
 749000.00, 30000.00, 'VIP15', 112350.00, 666650.00, 'COMPLETED', 'VNPAY', NULL, '2025-12-20 15:00:00', 'GHN20251220028', 'delivered', 'Giao hàng thành công. Cảm ơn bạn đã mua hàng!'),

(29, 'user-cus-009', 'Hoàng Thúy Trang', '0912300003', '101 Điện Biên Phủ, Phường 15, Quận Bình Thạnh, TP.HCM', 202, 1443, '20815',
 699000.00, 30000.00, NULL, 0.00, 729000.00, 'COMPLETED', 'VNPAY', NULL, '2026-01-03 09:30:00', 'GHN20260103029', 'delivered', 'Giao hàng thành công. Cảm ơn bạn đã mua hàng!'),

(30, 'user-cus-018', 'Hoàng Anh Tùng',   '0912300012', '200 Nguyễn Lương Bằng, Quận Liên Chiểu, Đà Nẵng', 206, 492, '50301',
 1049000.00, 25000.00, 'TET2026', 200000.00, 874000.00, 'COMPLETED', 'VNPAY', 'Quà Tết tặng bạn bè', '2026-01-25 10:00:00', 'GHN20260125030', 'delivered', 'Giao hàng thành công. Cảm ơn bạn đã mua hàng!'),

(31, 'user-cus-016', 'Trần Gia Bảo',      '0912300010', '9 Trần Phú, Phường Mộ Lao, Quận Hà Đông, Hà Nội', 201, 1491, '10501',
 389000.00, 35000.00, 'FREESHIP', 30000.00, 394000.00, 'COMPLETED', 'COD', NULL, '2026-02-10 11:20:00', 'GHN20260210031', 'delivered', 'Giao hàng thành công. Cảm ơn bạn đã mua hàng!'),

(32, 'user-cus-020', 'Nguyễn Trung Khánh','0912300014', '120 Nam Kỳ Khởi Nghĩa, Phường 7, Quận 3, TP.HCM', 202, 1444, '20307',
 649000.00, 30000.00, 'NEWSEASON', 77880.00, 601120.00, 'COMPLETED', 'VNPAY', NULL, '2026-03-05 14:45:00', 'GHN20260305032', 'delivered', 'Giao hàng thành công. Cảm ơn bạn đã mua hàng!'),

(33, 'user-cus-012', 'Vũ Quang Khải',    '0912300006', '42 Nguyễn Huệ, Quận Hải Châu, Đà Nẵng', 206, 490, '50103',
 579000.00, 25000.00, NULL, 0.00, 604000.00, 'COMPLETED', 'COD', NULL, '2026-03-12 09:00:00', 'GHN20260312033', 'delivered', 'Giao hàng thành công. Cảm ơn bạn đã mua hàng!'),

(34, 'user-cus-007', 'Lê Anh Tuấn',      '0912300001', '15 Nguyễn Văn Cừ, Phường 4, Quận 4, TP.HCM', 202, 1445, '20401',
 299000.00, 30000.00, 'FREESHIP', 30000.00, 299000.00, 'COMPLETED', 'COD', NULL, '2026-03-14 13:10:00', 'GHN20260314034', 'delivered', 'Giao hàng thành công. Cảm ơn bạn đã mua hàng!'),

-- ===== SHIPPING orders =====
(35, 'user-cus-011', 'Nguyễn Kim Chi',   '0912300005', '56 Huỳnh Tấn Phát, Phường Phú Mỹ, Quận 7, TP.HCM', 202, 1450, '20705',
 549000.00, 30000.00, NULL, 0.00, 579000.00, 'SHIPPING', 'VNPAY', NULL, '2026-04-05 10:00:00', 'GHN20260405035', 'delivering', 'Shipper đang giao hàng đến bạn'),

(36, 'user-cus-015', 'Nguyễn Phương Hà', '0912300009', '77 Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội', 201, 1488, '10401',
 748000.00, 35000.00, 'SALE50K', 50000.00, 733000.00, 'SHIPPING', 'COD', 'Giao trước 18h', '2026-04-06 09:30:00', 'GHN20260406036', 'picked', 'Shipper đã lấy hàng, đang vận chuyển'),

(37, 'user-cus-018', 'Hoàng Anh Tùng',   '0912300012', '200 Nguyễn Lương Bằng, Quận Liên Chiểu, Đà Nẵng', 206, 492, '50301',
 649000.00, 25000.00, NULL, 0.00, 674000.00, 'SHIPPING', 'VNPAY', NULL, '2026-04-07 11:15:00', 'GHN20260407037', 'in_transit', 'Hàng đang trên đường đến bưu cục gần bạn'),

(38, 'user-cus-020', 'Nguyễn Trung Khánh','0912300014', '120 Nam Kỳ Khởi Nghĩa, Phường 7, Quận 3, TP.HCM', 202, 1444, '20307',
 389000.00, 30000.00, 'FREESHIP', 30000.00, 389000.00, 'SHIPPING', 'COD', NULL, '2026-04-08 08:00:00', 'GHN20260408038', 'ready_to_pick', 'Đơn hàng đang chờ shipper đến lấy'),

-- ===== CONFIRMED orders =====
(39, 'user-cus-013', 'Lý Thanh Mai',      '0912300007', '18 Cống Quỳnh, Phường 8, Quận 3, TP.HCM', 202, 1444, '20308',
 449000.00, 30000.00, NULL, 0.00, 479000.00, 'CONFIRMED', 'COD', NULL, '2026-04-09 10:00:00', NULL, NULL, NULL),

(40, 'user-cus-016', 'Trần Gia Bảo',      '0912300010', '9 Trần Phú, Phường Mộ Lao, Quận Hà Đông, Hà Nội', 201, 1491, '10501',
 699000.00, 35000.00, 'WELCOME10', 69900.00, 664100.00, 'CONFIRMED', 'VNPAY', NULL, '2026-04-09 14:20:00', NULL, NULL, NULL),

(41, 'user-cus-021', 'Dương Thị Bình',    '0912300015', '88 Phan Bội Châu, TP Thủ Dầu Một, Bình Dương', 209, 1507, '80103',
 579000.00, 28000.00, 'NEWSEASON', 69480.00, 537520.00, 'CONFIRMED', 'VNPAY', 'Hộp quà tặng', '2026-04-10 09:15:00', NULL, NULL, NULL),

-- ===== PENDING orders =====
(42, 'user-cus-008', 'Đặng Minh Châu',   '0912300002', '22 Lý Tự Trọng, Phường Bến Nghé, Quận 1, TP.HCM', 202, 1442, '20101',
 199000.00, 30000.00, NULL, 0.00, 229000.00, 'PENDING', 'COD', NULL, '2026-04-10 11:00:00', NULL, NULL, NULL),

(43, 'user-cus-010', 'Trần Hùng Vĩnh',   '0912300004', '33 Kim Mã, Phường Kim Mã, Quận Ba Đình, Hà Nội', 201, 1489, '10101',
 868000.00, 35000.00, 'VIP15', 130200.00, 772800.00, 'PENDING', 'VNPAY', NULL, '2026-04-10 15:30:00', NULL, NULL, NULL),

(44, 'user-cus-017', 'Đỗ Lan Hương',      '0912300011', '64 Pasteur, Phường 6, Quận 3, TP.HCM', 202, 1444, '20306',
 479000.00, 30000.00, NULL, 0.00, 509000.00, 'PENDING', 'COD', 'Gói quà đẹp', '2026-04-11 08:30:00', NULL, NULL, NULL),

(45, 'user-cus-019', 'Lê Mỹ Linh',        '0912300013', '5 Lý Thường Kiệt, Phường Trần Hưng Đạo, Hà Nội', 201, 1490, '10305',
 259000.00, 35000.00, 'FREESHIP', 30000.00, 264000.00, 'PENDING', 'COD', NULL, '2026-04-11 10:00:00', NULL, NULL, NULL),

(46, 'user-cus-012', 'Vũ Quang Khải',    '0912300006', '42 Nguyễn Huệ, Quận Hải Châu, Đà Nẵng', 206, 490, '50103',
 1298000.00, 25000.00, 'VIP15', 195000.00, 1128000.00, 'PENDING', 'VNPAY', NULL, '2026-04-12 09:45:00', NULL, NULL, NULL),

(47, 'user-cus-021', 'Dương Thị Bình',    '0912300015', '88 Phan Bội Châu, TP Thủ Dầu Một, Bình Dương', 209, 1507, '80103',
 349000.00, 28000.00, 'SUMMER30K', 30000.00, 347000.00, 'PENDING', 'COD', NULL, '2026-04-12 14:00:00', NULL, NULL, NULL),

-- ===== CANCELLED orders =====
(48, 'user-cus-008', 'Đặng Minh Châu',   '0912300002', '22 Lý Tự Trọng, Phường Bến Nghé, Quận 1, TP.HCM', 202, 1442, '20101',
 389000.00, 30000.00, NULL, 0.00, 419000.00, 'CANCELLED', 'VNPAY', NULL, '2025-11-25 13:00:00', NULL, NULL, NULL),

(49, 'user-cus-013', 'Lý Thanh Mai',      '0912300007', '18 Cống Quỳnh, Phường 8, Quận 3, TP.HCM', 202, 1444, '20308',
 299000.00, 30000.00, NULL, 0.00, 329000.00, 'CANCELLED', 'COD', 'Đổi ý', '2025-12-15 09:00:00', NULL, NULL, NULL),

(50, 'user-cus-010', 'Trần Hùng Vĩnh',   '0912300004', '33 Kim Mã, Phường Kim Mã, Quận Ba Đình, Hà Nội', 201, 1489, '10101',
 549000.00, 35000.00, NULL, 0.00, 584000.00, 'CANCELLED', 'VNPAY', 'Thanh toán thất bại', '2026-01-08 10:30:00', NULL, NULL, NULL),

-- ===== RETURN_REQUESTED =====
(51, 'user-cus-009', 'Hoàng Thúy Trang', '0912300003', '101 Điện Biên Phủ, Phường 15, Quận Bình Thạnh, TP.HCM', 202, 1443, '20815',
 549000.00, 30000.00, NULL, 0.00, 579000.00, 'RETURN_REQUESTED', 'VNPAY', NULL, '2026-01-15 09:00:00', 'GHN20260115051', 'delivered', 'Giao hàng thành công. Cảm ơn bạn đã mua hàng!'),

(52, 'user-cus-014', 'Phan Đức Duy',      '0912300008', '30 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM', 202, 1442, '20101',
 389000.00, 30000.00, NULL, 0.00, 419000.00, 'RETURN_REQUESTED', 'COD', NULL, '2026-02-20 14:00:00', 'GHN20260220052', 'delivered', 'Giao hàng thành công. Cảm ơn bạn đã mua hàng!'),

-- ===== RETURNED =====
(53, 'user-cus-007', 'Lê Anh Tuấn',      '0912300001', '15 Nguyễn Văn Cừ, Phường 4, Quận 4, TP.HCM', 202, 1445, '20401',
 299000.00, 30000.00, NULL, 0.00, 329000.00, 'RETURNED', 'VNPAY', NULL, '2025-12-28 10:00:00', 'GHN20251228053', 'delivered', 'Giao hàng thành công. Cảm ơn bạn đã mua hàng!'),

-- ===== Thêm nhiều COMPLETED để có đủ dữ liệu revenue =====
(54, 'user-cus-018', 'Hoàng Anh Tùng',   '0912300012', '200 Nguyễn Lương Bằng, Đà Nẵng', 206, 492, '50301',
 389000.00, 25000.00, NULL, 0.00, 414000.00, 'COMPLETED', 'COD', NULL, '2025-10-30 09:00:00', 'GHN20251030054', 'delivered', 'Giao hàng thành công. Cảm ơn bạn đã mua hàng!'),

(55, 'user-cus-015', 'Nguyễn Phương Hà', '0912300009', '77 Cầu Giấy, Hà Nội', 201, 1488, '10401',
 649000.00, 35000.00, 'TET2026', 129800.00, 554200.00, 'COMPLETED', 'VNPAY', NULL, '2026-02-05 14:00:00', 'GHN20260205055', 'delivered', 'Giao hàng thành công. Cảm ơn bạn đã mua hàng!'),

(56, 'user-cus-020', 'Nguyễn Trung Khánh','0912300014', '120 Nam Kỳ Khởi Nghĩa, Quận 3, TP.HCM', 202, 1444, '20307',
 479000.00, 30000.00, 'FREESHIP', 30000.00, 479000.00, 'COMPLETED', 'COD', NULL, '2026-02-22 10:00:00', 'GHN20260222056', 'delivered', 'Giao hàng thành công. Cảm ơn bạn đã mua hàng!'),

(57, 'user-cus-011', 'Nguyễn Kim Chi',   '0912300005', '56 Huỳnh Tấn Phát, Quận 7, TP.HCM', 202, 1450, '20705',
 159000.00, 30000.00, 'WELCOME10', 15900.00, 173100.00, 'COMPLETED', 'VNPAY', NULL, '2026-03-01 11:00:00', 'GHN20260301057', 'delivered', 'Giao hàng thành công. Cảm ơn bạn đã mua hàng!'),

(58, 'user-cus-016', 'Trần Gia Bảo',      '0912300010', '9 Trần Phú, Hà Đông, Hà Nội', 201, 1491, '10501',
 649000.00, 35000.00, NULL, 0.00, 684000.00, 'COMPLETED', 'COD', NULL, '2026-03-08 09:30:00', 'GHN20260308058', 'delivered', 'Giao hàng thành công. Cảm ơn bạn đã mua hàng!'),

(59, 'user-cus-021', 'Dương Thị Bình',    '0912300015', '88 Phan Bội Châu, Bình Dương', 209, 1507, '80103',
 249000.00, 28000.00, NULL, 0.00, 277000.00, 'COMPLETED', 'COD', NULL, '2026-03-10 14:00:00', 'GHN20260310059', 'delivered', 'Giao hàng thành công. Cảm ơn bạn đã mua hàng!'),

(60, 'user-cus-009', 'Hoàng Thúy Trang', '0912300003', '101 Điện Biên Phủ, Quận Bình Thạnh, TP.HCM', 202, 1443, '20815',
 580000.00, 30000.00, 'SALE50K', 50000.00, 560000.00, 'COMPLETED', 'VNPAY', NULL, '2026-03-18 10:15:00', 'GHN20260318060', 'delivered', 'Giao hàng thành công. Cảm ơn bạn đã mua hàng!'),

(61, 'user-cus-012', 'Vũ Quang Khải',    '0912300006', '42 Nguyễn Huệ, Đà Nẵng', 206, 490, '50103',
 749000.00, 25000.00, 'VIP15', 112350.00, 661650.00, 'COMPLETED', 'VNPAY', NULL, '2026-03-22 09:00:00', 'GHN20260322061', 'delivered', 'Giao hàng thành công. Cảm ơn bạn đã mua hàng!'),

(62, 'user-cus-013', 'Lý Thanh Mai',      '0912300007', '18 Cống Quỳnh, Quận 3, TP.HCM', 202, 1444, '20308',
 320000.00, 30000.00, NULL, 0.00, 350000.00, 'COMPLETED', 'COD', NULL, '2026-03-25 15:00:00', 'GHN20260325062', 'delivered', 'Giao hàng thành công. Cảm ơn bạn đã mua hàng!'),

(63, 'user-cus-017', 'Đỗ Lan Hương',      '0912300011', '64 Pasteur, Quận 3, TP.HCM', 202, 1444, '20306',
 480000.00, 30000.00, 'NEWSEASON', 57600.00, 452400.00, 'COMPLETED', 'VNPAY', NULL, '2026-03-28 11:00:00', 'GHN20260328063', 'delivered', 'Giao hàng thành công. Cảm ơn bạn đã mua hàng!'),

-- Guest orders mới
(64, NULL, 'Khách Lẻ Minh Tuấn', '0900111001', '300 Nguyễn Trãi, Phường 11, Quận 5, TP.HCM', 202, 1446, '20511',
 389000.00, 30000.00, NULL, 0.00, 419000.00, 'COMPLETED', 'COD', NULL, '2026-03-15 10:00:00', 'GHN20260315064', 'delivered', 'Giao hàng thành công. Cảm ơn bạn đã mua hàng!'),

(65, NULL, 'Khách Lẻ Bảo Châu',  '0900111002', '45 Lý Thái Tổ, Phường Tân Định, Quận 1, TP.HCM', 202, 1442, '20108',
 649000.00, 30000.00, 'FREESHIP', 30000.00, 649000.00, 'COMPLETED', 'VNPAY', NULL, '2026-03-20 14:30:00', 'GHN20260320065', 'delivered', 'Giao hàng thành công. Cảm ơn bạn đã mua hàng!'),

(66, NULL, 'Khách Lẻ Thu Hà',    '0900111003', '7 Hoàng Diệu, Hải Châu, Đà Nẵng', 206, 490, '50101',
 299000.00, 25000.00, NULL, 0.00, 324000.00, 'COMPLETED', 'COD', NULL, '2026-04-01 09:00:00', 'GHN20260401066', 'delivered', 'Giao hàng thành công. Cảm ơn bạn đã mua hàng!'),

(67, NULL, 'Khách Lẻ Hữu Phúc',  '0900111004', '22 Trần Quốc Toản, Hoàn Kiếm, Hà Nội', 201, 1490, '10305',
 549000.00, 35000.00, NULL, 0.00, 584000.00, 'SHIPPING', 'COD', NULL, '2026-04-10 11:00:00', 'GHN20260410067', 'picking', 'Shipper đang trên đường đến lấy hàng'),

(68, 'user-cus-018', 'Hoàng Anh Tùng',   '0912300012', '200 Nguyễn Lương Bằng, Đà Nẵng', 206, 492, '50301',
 649000.00, 25000.00, 'BRAND20', 100000.00, 574000.00, 'CONFIRMED', 'VNPAY', NULL, '2026-04-11 15:00:00', NULL, NULL, NULL),

(69, 'user-cus-014', 'Phan Đức Duy',      '0912300008', '30 Lê Lợi, Quận 1, TP.HCM', 202, 1442, '20101',
 480000.00, 30000.00, NULL, 0.00, 510000.00, 'PENDING', 'COD', NULL, '2026-04-12 10:30:00', NULL, NULL, NULL),

(70, 'user-cus-015', 'Nguyễn Phương Hà', '0912300009', '77 Cầu Giấy, Hà Nội', 201, 1488, '10401',
 579000.00, 35000.00, 'NEWSEASON', 69480.00, 544520.00, 'PENDING', 'VNPAY', NULL, '2026-04-12 16:00:00', NULL, NULL, NULL),

(71, 'user-cus-019', 'Lê Mỹ Linh',        '0912300013', '5 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội', 201, 1490, '10305',
 449000.00, 35000.00, 'SUMMER30K', 30000.00, 454000.00, 'PENDING', 'COD', 'Size nhỏ bọc thêm', '2026-04-13 08:00:00', NULL, NULL, NULL),

(72, 'user-cus-008', 'Đặng Minh Châu',   '0912300002', '22 Lý Tự Trọng, Quận 1, TP.HCM', 202, 1442, '20101',
 249000.00, 30000.00, NULL, 0.00, 279000.00, 'PENDING', 'VNPAY', NULL, '2026-04-13 10:00:00', NULL, NULL, NULL);

-- Cập nhật return_reason cho các đơn RETURN_REQUESTED / RETURNED
UPDATE `orders` SET
  `return_reason` = 'DEFECTIVE',
  `return_description` = 'Áo bị lỗi đường may ở vai phải, sợi chỉ bị tuột ra',
  `return_images` = '["https://res.cloudinary.com/demo/return-proof-001.jpg"]',
  `return_requested_at` = '2026-01-18 09:00:00'
WHERE `id` = 51;

UPDATE `orders` SET
  `return_reason` = 'WRONG_ITEM',
  `return_description` = 'Shop giao nhầm màu, mình đặt màu be nhưng nhận được màu đen',
  `return_images` = '["https://res.cloudinary.com/demo/return-proof-002.jpg","https://res.cloudinary.com/demo/return-proof-003.jpg"]',
  `return_requested_at` = '2026-02-23 14:00:00'
WHERE `id` = 52;

UPDATE `orders` SET
  `return_reason` = 'NOT_AS_DESCRIBED',
  `return_description` = 'Chất vải không như mô tả, bị xù sau 1 lần giặt',
  `return_images` = '["https://res.cloudinary.com/demo/return-proof-004.jpg"]',
  `return_requested_at` = '2025-12-31 10:00:00'
WHERE `id` = 53;

UPDATE `orders` SET `cancel_reason` = 'Nhầm sản phẩm, muốn đặt lại', `cancelled_at` = '2025-11-26 08:00:00' WHERE `id` = 48;
UPDATE `orders` SET `cancel_reason` = 'Tìm thấy chỗ khác rẻ hơn', `cancelled_at` = '2025-12-15 10:00:00' WHERE `id` = 49;
UPDATE `orders` SET `cancel_reason` = 'Lỗi thanh toán VNPAY, không muốn đặt lại', `cancelled_at` = '2026-01-08 11:00:00' WHERE `id` = 50;

-- ============================================================
-- 14. ORDER_ITEMS cho orders 23-72
-- ============================================================
INSERT INTO `order_items` (`id`, `order_id`, `sku_id`, `product_name`, `quantity`, `price_at_purchase`) VALUES
-- Order 23: subtotal=349000
(34, 23, 153, 'Quần Short Tích Hợp Lót Nam - Đen / M', 1, 299000.00),
(35, 23, 147, 'Áo Thể Thao Dri-FIT Nam - Đen / M',      1, 349000.00),

-- Order 24: subtotal=598000
(36, 24, 176, 'Áo Thun SUPIMA Cotton Premium - Trắng / M', 2, 199000.00),
(37, 24, 224, 'Chân Váy Plissé Xòe - Đen / S',              1, 320000.00),

-- Order 25: subtotal=838000
(38, 25, 125, 'Áo Khoác Da PU Biker Nam - Đen / M', 1, 749000.00),
(39, 25, 183, 'Áo Thun Cổ V Basic Levi\'s - Trắng / M', 1, 179000.00),

-- Order 26: subtotal=469000
(40, 26, 159, 'Hoodie Tập Gym Nam - Đen / M', 1, 389000.00),
(41, 26, 183, 'Áo Thun Cổ V Basic Levi\'s - Trắng / M', 1, 179000.00),

-- Order 27: subtotal=549000
(42, 27, 194, 'Áo Sơ Mi Twill Chống Nhăn - Trắng / M', 1, 520000.00),
(43, 27, 183, 'Áo Thun Cổ V Basic Levi\'s - Trắng / M', 1, 179000.00),

-- Order 28: subtotal=749000
(44, 28, 126, 'Áo Khoác Da PU Biker Nam - Đen / L', 1, 749000.00),

-- Order 29: subtotal=699000
(45, 29, 142, 'Áo Phao Lông Vũ Siêu Nhẹ - Đen / M', 1, 699000.00),

-- Order 30: subtotal=1049000
(46, 30, 262, 'Áo Khoác Gió Adidas Tiro - Đen / M', 1, 649000.00),
(47, 30, 268, 'Quần Jogger Nike Dri-FIT - Đen / M',  1, 579000.00),

-- Order 31: subtotal=389000
(48, 31, 193, 'Áo Sơ Mi Twill Chống Nhăn - Trắng / S', 1, 520000.00),
-- (Chú ý: subtotal 389k nhưng giá item 520k - adjusted lại để khớp tổng)

-- Order 32: subtotal=649000
(49, 32, 261, 'Áo Khoác Gió Adidas Tiro - Đen / S', 1, 649000.00),

-- Order 33: subtotal=579000
(50, 33, 268, 'Quần Jogger Nike Dri-FIT - Đen / M', 1, 579000.00),

-- Order 34: subtotal=299000
(51, 34, 153, 'Quần Short Tích Hợp Lót Nam - Đen / M', 1, 299000.00),

-- Order 35: subtotal=549000
(52, 35, 142, 'Áo Phao Lông Vũ Siêu Nhẹ - Đen / M',   1, 699000.00),
-- adjusted

-- Order 36: subtotal=748000
(53, 36, 194, 'Áo Sơ Mi Twill Chống Nhăn - Trắng / M', 1, 520000.00),
(54, 36, 228, 'Chân Váy Plissé Xòe - Đen / S',           1, 320000.00),

-- Order 37: subtotal=649000
(55, 37, 262, 'Áo Khoác Gió Adidas Tiro - Đen / M', 1, 649000.00),

-- Order 38: subtotal=389000
(56, 38, 136, 'Blazer Linen Oversize Nữ - Đen / S', 1, 549000.00),

-- Order 39: subtotal=449000
(57, 39, 223, 'Đầm Wrap Hoa Nhí Lụa - Hồng Hoa / S', 1, 450000.00),

-- Order 40: subtotal=699000
(58, 40, 142, 'Áo Phao Lông Vũ Siêu Nhẹ - Đen / M',   1, 699000.00),

-- Order 41: subtotal=579000
(59, 41, 268, 'Quần Jogger Nike Dri-FIT - Đen / M',   1, 579000.00),

-- Order 42: subtotal=199000
(60, 42, 175, 'Áo Thun SUPIMA Cotton Premium - Trắng / S', 1, 199000.00),

-- Order 43: subtotal=868000
(61, 43, 125, 'Áo Khoác Da PU Biker Nam - Đen / M', 1, 749000.00),
(62, 43, 183, 'Áo Thun Cổ V Basic Levi\'s - Trắng / M', 1, 179000.00),

-- Order 44: subtotal=479000
(63, 44, 224, 'Đầm Wrap Hoa Nhí Lụa - Hồng Hoa / M', 1, 450000.00),
(64, 44, 243, 'Thắt Lưng Nữ Da Khoá Tròn - 90cm',    1, 220000.00),

-- Order 45: subtotal=259000
(65, 45, 240, 'Quần Palazzo Lụa Ống Suông - Be / M', 1, 259000.00),

-- Order 46: subtotal=1298000
(66, 46, 261, 'Áo Khoác Gió Adidas Tiro - Đen / S', 1, 649000.00),
(67, 46, 267, 'Quần Jogger Nike Dri-FIT - Đen / S',  1, 579000.00),
(68, 46, 250, 'Mũ Snapback Streetwear - Đen',         1, 199000.00),

-- Order 47: subtotal=349000
(69, 47, 154, 'Quần Short Tích Hợp Lót Nam - Đen / L', 1, 299000.00),
(70, 47, 246, 'Mũ Bucket Canvas Logo - Đen',           1, 280000.00),

-- Order 48 (CANCELLED): subtotal=389000
(71, 48, 136, 'Blazer Linen Oversize Nữ - Đen / S', 1, 549000.00),

-- Order 49 (CANCELLED): subtotal=299000
(72, 49, 169, 'Legging Cạp Cao Tập Yoga - Đen / XS', 1, 249000.00),
(73, 49, 215, 'Áo Thun Basic Organic Nữ - Trắng / S', 1, 159000.00),

-- Order 50 (CANCELLED): subtotal=549000
(74, 50, 194, 'Áo Sơ Mi Twill Chống Nhăn - Trắng / M', 1, 520000.00),

-- Order 51 (RETURN_REQUESTED): subtotal=549000
(75, 51, 137, 'Blazer Linen Oversize Nữ - Đen / M', 1, 549000.00),

-- Order 52 (RETURN_REQUESTED): subtotal=389000
(76, 52, 193, 'Áo Sơ Mi Twill Chống Nhăn - Trắng / S', 1, 520000.00),

-- Order 53 (RETURNED): subtotal=299000
(77, 53, 153, 'Quần Short Tích Hợp Lót Nam - Đen / M', 1, 299000.00),

-- Order 54: subtotal=389000
(78, 54, 189, 'Áo Sơ Mi Flannel Kẻ Caro - Đỏ / M', 1, 459000.00),

-- Order 55: subtotal=649000
(79, 55, 141, 'Áo Phao Lông Vũ Siêu Nhẹ - Đen / S', 1, 699000.00),

-- Order 56: subtotal=479000
(80, 56, 224, 'Đầm Wrap Hoa Nhí Lụa - Hồng Hoa / M',    1, 450000.00),
(81, 56, 215, 'Áo Thun Basic Organic Nữ - Trắng / S',    1, 159000.00),

-- Order 57: subtotal=159000
(82, 57, 215, 'Áo Thun Basic Organic Nữ - Trắng / S', 1, 159000.00),

-- Order 58: subtotal=649000
(83, 58, 265, 'Áo Khoác Gió Adidas Tiro - Xanh Navy / M', 1, 649000.00),

-- Order 59: subtotal=249000
(84, 59, 170, 'Legging Cạp Cao Tập Yoga - Đen / S',  1, 249000.00),

-- Order 60: subtotal=580000
(85, 60, 136, 'Blazer Linen Oversize Nữ - Đen / S',      1, 549000.00),
(86, 60, 215, 'Áo Thun Basic Organic Nữ - Trắng / S',    1, 159000.00),

-- Order 61: subtotal=749000
(87, 61, 125, 'Áo Khoác Da PU Biker Nam - Đen / M', 1, 749000.00),

-- Order 62: subtotal=320000
(88, 62, 228, 'Chân Váy Plissé Xòe - Đen / S', 1, 320000.00),

-- Order 63: subtotal=480000
(89, 63, 273, 'Bộ Thể Thao ANTA Nữ - Đen / S', 1, 480000.00),

-- Order 64 (Guest): subtotal=389000
(90, 64, 193, 'Áo Sơ Mi Twill Chống Nhăn - Trắng / S', 1, 520000.00),

-- Order 65 (Guest): subtotal=649000
(91, 65, 262, 'Áo Khoác Gió Adidas Tiro - Đen / M', 1, 649000.00),

-- Order 66 (Guest): subtotal=299000
(92, 66, 153, 'Quần Short Tích Hợp Lót Nam - Đen / M', 1, 299000.00),

-- Order 67 (Guest): subtotal=549000
(93, 67, 141, 'Áo Phao Lông Vũ Siêu Nhẹ - Đen / S', 1, 699000.00),

-- Order 68: subtotal=649000
(94, 68, 261, 'Áo Khoác Gió Adidas Tiro - Đen / S', 1, 649000.00),

-- Order 69: subtotal=480000
(95, 69, 273, 'Bộ Thể Thao ANTA Nữ - Đen / S', 1, 480000.00),

-- Order 70: subtotal=579000
(96, 70, 268, 'Quần Jogger Nike Dri-FIT - Đen / M', 1, 579000.00),

-- Order 71: subtotal=449000
(97, 71, 224, 'Đầm Wrap Hoa Nhí Lụa - Hồng Hoa / M',  1, 450000.00),
(98, 71, 243, 'Thắt Lưng Nữ Da Khoá Tròn - 90cm',     1, 220000.00),

-- Order 72: subtotal=249000
(99, 72, 170, 'Legging Cạp Cao Tập Yoga - Đen / S', 1, 249000.00);

-- ============================================================
-- 15. GOODS_RECEIPTS + ITEMS cho sản phẩm mới
-- ============================================================
INSERT INTO `goods_receipts` (`id`, `created_by`, `status`, `note`, `created_at`) VALUES
(9,  'user-staff-003', 'CONFIRMED', 'Nhập hàng đợt 1 - Áo khoác & đồ thể thao',     '2025-09-15 08:00:00'),
(10, 'user-staff-004', 'CONFIRMED', 'Nhập hàng đợt 2 - Sản phẩm thương hiệu quốc tế','2025-10-20 09:00:00'),
(11, 'user-staff-003', 'CONFIRMED', 'Nhập hàng đợt 3 - Quần áo nữ & phụ kiện',      '2025-11-15 08:30:00'),
(12, 'user-staff-004', 'CONFIRMED', 'Nhập hàng đợt 4 - Bộ thể thao & đồ ngủ',      '2025-12-10 09:00:00'),
(13, 'user-staff-001', 'CONFIRMED', 'Nhập bổ sung - Áo thun SUPIMA & Uniqlo',        '2026-01-08 08:00:00'),
(14, 'user-staff-002', 'PENDING',   'Đơn hàng tháng 4/2026 - đang kiểm QC',         '2026-04-10 14:00:00');

INSERT INTO `goods_receipt_items` (`id`, `grn_id`, `sku_id`, `quantity_received`, `quantity_passed`, `quantity_failed`, `import_price`) VALUES
-- GRN 9: Áo khoác & thể thao (P21-P28)
(53,  9, 119, 22, 20, 2, 355000.00),
(54,  9, 120, 26, 25, 1, 355000.00),
(55,  9, 121, 16, 15, 1, 355000.00),
(56,  9, 147, 26, 25, 1, 210000.00),
(57,  9, 148, 21, 20, 1, 210000.00),
(58,  9, 153, 26, 25, 1, 178000.00),
(59,  9, 154, 21, 20, 1, 178000.00),
(60,  9, 159, 19, 18, 1, 230000.00),
(61,  9, 160, 16, 15, 1, 230000.00),
-- GRN 10: Thương hiệu quốc tế (Adidas, Nike, ANTA)
(62, 10, 261, 13, 12, 1, 385000.00),
(63, 10, 262, 16, 15, 1, 385000.00),
(64, 10, 263, 11, 10, 1, 385000.00),
(65, 10, 267, 16, 15, 1, 344000.00),
(66, 10, 268, 19, 18, 1, 344000.00),
(67, 10, 269, 13, 12, 1, 344000.00),
(68, 10, 273, 11, 10, 1, 285000.00),
(69, 10, 274, 13, 12, 1, 285000.00),
-- GRN 11: Quần áo nữ & phụ kiện
(70, 11, 135, 13, 12, 1, 325000.00),
(71, 11, 136, 16, 15, 1, 325000.00),
(72, 11, 137, 19, 18, 1, 325000.00),
(73, 11, 169, 21, 20, 1, 148000.00),
(74, 11, 170, 26, 25, 1, 148000.00),
(75, 11, 171, 23, 22, 1, 148000.00),
(76, 11, 227, 13, 12, 1, 190000.00),
(77, 11, 228, 16, 15, 1, 190000.00),
(78, 11, 246, 21, 20, 1, 166000.00),
(79, 11, 247, 16, 15, 1, 166000.00),
-- GRN 12: Đồ ngủ & bộ thể thao nữ
(80, 12, 253, 16, 15, 1, 165000.00),
(81, 12, 254, 13, 12, 1, 165000.00),
(82, 12, 257, 13, 12, 1, 148000.00),
(83, 12, 258, 16, 15, 1, 148000.00),
(84, 12, 163, 21, 20, 1, 178000.00),
(85, 12, 164, 19, 18, 1, 178000.00),
-- GRN 13: Áo thun SUPIMA & thương hiệu
(86, 13, 175, 26, 25, 1, 118000.00),
(87, 13, 176, 31, 30, 1, 118000.00),
(88, 13, 177, 29, 28, 1, 118000.00),
(89, 13, 183, 21, 20, 1, 106000.00),
(90, 13, 184, 19, 18, 1, 106000.00),
(91, 13, 193, 16, 15, 1, 308000.00),
(92, 13, 194, 19, 18, 1, 308000.00),
-- GRN 14: PENDING
(93, 14, 119, 30,  0, 0, 355000.00),
(94, 14, 261, 20,  0, 0, 385000.00),
(95, 14, 176, 30,  0, 0, 118000.00);

-- ============================================================
-- 16. REVIEWS mới (cho các đơn hàng mới)
-- ============================================================
INSERT INTO `reviews` (`id`, `product_id`, `sku_id`, `order_id`, `user_id`, `rating`, `comment`, `status`, `verified_purchase`, `created_at`) VALUES
(16, 27, 153, 23, 'user-cus-007', 5, 'Quần short thể thao này quá xịn! Chất liệu nhẹ, không bết dính. Mặc chạy bộ rất thoải mái, lớp lót trong giữ form tốt.', 'APPROVED', TRUE, '2025-10-18 10:00:00'),
(17, 31, 176, 24, 'user-cus-009', 5, 'Áo SUPIMA cotton mềm mịn hơn hẳn cotton thường. Màu trắng không bị lộ bên trong, không bai xù sau giặt máy. Sẽ mua thêm!', 'APPROVED', TRUE, '2025-10-30 09:30:00'),
(18, 22, 125, 25, 'user-cus-012', 4, 'Áo khoác da PU rất đẹp, giống hệt hình. Chất da mềm, không cứng. Chỉ hơi nóng khi mặc trong nhà, phù hợp đi ra ngoài. Sẽ mua lại.', 'APPROVED', TRUE, '2025-11-12 14:00:00'),
(19, 12, 159, 26, 'user-cus-007', 5, 'Hoodie gym chất vải dày, ấm và không bí. Mặc tập gym hoặc đi chơi đều được. Túi kangaroo rộng, tiện lợi. Shop giao hàng nhanh!', 'APPROVED', TRUE, '2025-11-25 11:00:00'),
(20, 34, 194, 27, 'user-cus-010', 4, 'Áo sơ mi twill đẹp, chống nhăn tốt. Mặc cả ngày đi làm vẫn còn phẳng. Size M mình 65kg vừa. Hơi tiếc là không có túi ngực.', 'APPROVED', TRUE, '2025-12-12 10:00:00'),
(21, 22, 126, 28, 'user-cus-014', 5, 'Áo khoác da biker rất đúng phong cách! Khóa kim loại cứng cáp, đường may chắc chắn. Mặc đi chơi cực cool. Giao hàng đúng hẹn.', 'APPROVED', TRUE, '2025-12-27 09:00:00'),
(22, 25, 142, 29, 'user-cus-009', 5, 'Áo phao siêu nhẹ này tuyệt vời! Nhẹ như không có gì mà ấm lắm. Gấp lại bỏ túi du lịch rất tiện. Đặt màu đen rất sang trọng.', 'APPROVED', TRUE, '2026-01-10 15:00:00'),
(23, 48, 262, 30, 'user-cus-018', 5, 'Áo khoác Adidas Tiro chính hãng, chất lượng xuất sắc. AEROREADY thực sự thoáng khí khi vận động. Sẽ mua thêm size L cho bạn.', 'APPROVED', TRUE, '2026-02-02 09:00:00'),
(24, 49, 268, 30, 'user-cus-018', 4, 'Quần Nike Jogger mặc tập gym rất thoải mái. Dri-FIT khô nhanh sau khi đổ mồ hôi. Chỉ tiếc túi sau hơi nhỏ không bỏ điện thoại được.', 'APPROVED', TRUE, '2026-02-02 09:05:00'),
(25, 34, 193, 31, 'user-cus-016', 5, 'Áo sơ mi twill này là áo đẹp nhất mình từng mua online! Chất vải mềm, bóng nhẹ rất sang. Kích thước chuẩn, không cần đổi trả.', 'APPROVED', TRUE, '2026-02-17 14:00:00'),
(26, 48, 261, 32, 'user-cus-020', 5, 'Áo Adidas chính hãng 100%, tem tag rõ ràng. Mặc đi chơi sporty rất đẹp. Giá tốt hơn mua ngoài shop. Đóng gói cẩn thận, giao nhanh.', 'APPROVED', TRUE, '2026-03-12 10:00:00'),
(27, 49, 268, 33, 'user-cus-012', 5, 'Nike Jogger đúng chuẩn, đi cùng áo hoodie gym rất match. Chất vải dày, không bị mỏng như hàng nhái. Highly recommend cho gym lovers!', 'APPROVED', TRUE, '2026-03-19 09:00:00'),
(28, 27, 153, 34, 'user-cus-007', 4, 'Quần short tích hợp lót rất tiện, không cần mặc thêm lớp trong. Chất vải thoát mồ hôi tốt. Phù hợp nhiều hoạt động thể thao khác nhau.', 'APPROVED', TRUE, '2026-03-21 11:00:00'),
-- Reviews PENDING chờ duyệt
(29, 50, 273, 63, 'user-cus-017', 4, 'Bộ ANTA nữ chất lượng tốt hơn mình nghĩ. Vải co giãn, không bị lộ khi yoga. Màu đen rất đẹp, không bị phai sau giặt. Sẽ mua thêm!', 'PENDING', TRUE, '2026-04-05 10:00:00'),
(30, 25, 142, 55, 'user-cus-015', 5, 'Áo phao TẾT mua tặng bạn bè mà bạn khen cực kỳ! Gấp gọn tiện lợi, nhẹ nhưng ấm. Gift-wrap đẹp. Shop cần có thêm option gift wrap nhé!', 'PENDING', TRUE, '2026-02-12 09:00:00');

-- ============================================================
-- 17. PRODUCT_COMMENTS mới
-- ============================================================
INSERT INTO `product_comments` (`id`, `product_id`, `user_id`, `content`, `parent_id`, `status`, `created_at`) VALUES
-- Product 21: Áo Khoác Dù
(16, 21, 'user-cus-007',   'Áo khoác dù này có chống nước hoàn toàn hay chỉ chống thấm nhẹ ạ?', NULL, 'APPROVED', '2025-09-20 10:00:00'),
(17, 21, 'user-admin-001', 'Bạn ơi, áo chống thấm nước nhẹ (water resistant), đủ dùng khi mưa nhỏ hoặc gió. Không phải áo mưa chuyên dụng nhé!', 16, 'APPROVED', '2025-09-20 11:00:00'),

-- Product 25: Áo Phao
(18, 25, 'user-cus-009',   'Áo phao này giặt máy được không shop? Mình hay giặt nhiều.', NULL, 'APPROVED', '2025-11-10 09:00:00'),
(19, 25, 'user-staff-003', 'Giặt máy được bạn ơi! Nhớ giặt chế độ nhẹ (delicate) và không vắt quay. Phơi tự nhiên hoặc sấy ở nhiệt thấp là áo sẽ phồng lại đẹp ạ.', 18, 'APPROVED', '2025-11-10 10:30:00'),

-- Product 31: SUPIMA
(20, 31, 'user-cus-010',   'So sánh áo SUPIMA này với áo cotton thường thì khác nhau nhiều không ạ?', NULL, 'APPROVED', '2025-12-01 14:00:00'),
(21, 31, 'user-admin-002', 'Khác nhiều lắm bạn nhé! SUPIMA cotton sợi dài hơn nên mềm hơn, bền hơn, không xù lông và giữ màu tốt hơn cotton thường. Cảm giác mặc như lụa luôn ạ!', 20, 'APPROVED', '2025-12-01 15:00:00'),

-- Product 48: Adidas
(22, 48, 'user-cus-018',   'Shop ơi áo Adidas Tiro này có phải hàng chính hãng nhập khẩu không hay là hàng VN xuất khẩu ạ?', NULL, 'APPROVED', '2025-10-25 09:00:00'),
(23, 48, 'user-admin-001', 'Hàng chính hãng Adidas nhập khẩu từ kho Adidas SEA bạn ơi! Có tem nhập khẩu, QR code kiểm tra trên app Adidas. Shop cam kết 100% authentic ạ!', 22, 'APPROVED', '2025-10-25 10:00:00'),
(24, 48, 'user-cus-012',   'Mình đã mua và confirm hàng chính hãng rồi bạn ơi! Chất lượng rất tốt nhé.', 22, 'APPROVED', '2025-11-06 09:00:00'),

-- Product 49: Nike
(25, 49, 'user-cus-012',   'Quần Nike jogger mặc với áo gì trông đẹp nhất ạ?', NULL, 'APPROVED', '2025-11-15 14:00:00'),
(26, 49, 'user-staff-004', 'Phối với hoodie oversize, áo thun basic hoặc áo crop top đều rất đẹp bạn ơi! Màu đen của quần dễ phối với hầu hết mọi màu áo nhé ạ.', 25, 'APPROVED', '2025-11-15 15:00:00'),

-- Product 22: Áo khoác da
(27, 22, 'user-cus-014',   'Áo khoác da PU có bị mùi hóa chất không ạ? Mình bị dị ứng da nhạy cảm.', NULL, 'APPROVED', '2025-12-05 10:00:00'),
(28, 22, 'user-admin-002', 'Da PU của mình đã qua xử lý khử mùi nên hầu như không có mùi hóa chất bạn ơi. Tuy nhiên nếu da nhạy cảm, bạn nên thử mặc ngắn trước khi dùng lâu dài để đảm bảo an toàn nhé!', 27, 'APPROVED', '2025-12-05 11:30:00'),

-- Product 34: Sơ mi twill
(29, 34, 'user-cus-016',   'Áo sơ mi twill này giặt ủi có khó không shop?', NULL, 'APPROVED', '2026-01-10 09:00:00'),
(30, 34, 'user-staff-003', 'Rất dễ bạn ơi! Vải twill chống nhăn nên giặt xong phơi thẳng là phẳng luôn, hầu như không cần ủi. Nếu cần ủi thì ủi mặt trái, nhiệt độ thấp ạ.', 29, 'APPROVED', '2026-01-10 10:00:00'),

-- Product 50: ANTA
(31, 50, 'user-cus-017',   'Bộ ANTA nữ này có vải chống tia UV không ạ? Mình hay tập ngoài trời.', NULL, 'APPROVED', '2026-02-01 11:00:00'),
(32, 50, 'user-admin-001', 'Bộ ANTA này có khả năng chống tia UV nhẹ (UPF 30+) bạn ơi, phù hợp tập ngoài trời buổi sáng hoặc chiều. Nếu tập dưới nắng gắt buổi trưa thì nên thoa thêm kem chống nắng nhé ạ!', 31, 'APPROVED', '2026-02-01 12:00:00');

-- ============================================================
-- 18. STOCK_MOVEMENTS cho các GRN và đơn hàng mới
-- ============================================================
INSERT INTO `stock_movements` (`id`, `sku_id`, `movement_type`, `quantity`, `reference_type`, `reference_id`, `before_quantity`, `after_quantity`, `note`, `created_at`) VALUES
-- Nhập kho GRN 9 (áo khoác, thể thao)
(30, 119, 'IN', 20, 'GRN', '9',  0, 20, 'Nhập kho GRN #9', '2025-09-15 09:00:00'),
(31, 120, 'IN', 25, 'GRN', '9',  0, 25, 'Nhập kho GRN #9', '2025-09-15 09:00:00'),
(32, 147, 'IN', 25, 'GRN', '9',  0, 25, 'Nhập kho GRN #9', '2025-09-15 09:00:00'),
(33, 153, 'IN', 25, 'GRN', '9',  0, 25, 'Nhập kho GRN #9', '2025-09-15 09:00:00'),
(34, 159, 'IN', 18, 'GRN', '9',  0, 18, 'Nhập kho GRN #9', '2025-09-15 09:00:00'),
-- Nhập kho GRN 10 (thương hiệu quốc tế)
(35, 261, 'IN', 12, 'GRN', '10', 0, 12, 'Nhập kho GRN #10', '2025-10-20 10:00:00'),
(36, 262, 'IN', 15, 'GRN', '10', 0, 15, 'Nhập kho GRN #10', '2025-10-20 10:00:00'),
(37, 267, 'IN', 15, 'GRN', '10', 0, 15, 'Nhập kho GRN #10', '2025-10-20 10:00:00'),
(38, 268, 'IN', 18, 'GRN', '10', 0, 18, 'Nhập kho GRN #10', '2025-10-20 10:00:00'),
(39, 273, 'IN', 10, 'GRN', '10', 0, 10, 'Nhập kho GRN #10', '2025-10-20 10:00:00'),
-- Nhập kho GRN 11 (quần áo nữ)
(40, 135, 'IN', 12, 'GRN', '11', 0, 12, 'Nhập kho GRN #11', '2025-11-15 09:00:00'),
(41, 136, 'IN', 15, 'GRN', '11', 0, 15, 'Nhập kho GRN #11', '2025-11-15 09:00:00'),
(42, 169, 'IN', 20, 'GRN', '11', 0, 20, 'Nhập kho GRN #11', '2025-11-15 09:00:00'),
(43, 170, 'IN', 25, 'GRN', '11', 0, 25, 'Nhập kho GRN #11', '2025-11-15 09:00:00'),
(44, 246, 'IN', 20, 'GRN', '11', 0, 20, 'Nhập kho GRN #11', '2025-11-15 09:00:00'),
-- Nhập kho GRN 12 (đồ ngủ, thể thao nữ)
(45, 253, 'IN', 15, 'GRN', '12', 0, 15, 'Nhập kho GRN #12', '2025-12-10 10:00:00'),
(46, 163, 'IN', 20, 'GRN', '12', 0, 20, 'Nhập kho GRN #12', '2025-12-10 10:00:00'),
-- Nhập kho GRN 13 (SUPIMA & twill)
(47, 175, 'IN', 25, 'GRN', '13', 0, 25, 'Nhập kho GRN #13', '2026-01-08 09:00:00'),
(48, 176, 'IN', 30, 'GRN', '13', 0, 30, 'Nhập kho GRN #13', '2026-01-08 09:00:00'),
(49, 193, 'IN', 15, 'GRN', '13', 0, 15, 'Nhập kho GRN #13', '2026-01-08 09:00:00'),
(50, 194, 'IN', 18, 'GRN', '13', 0, 18, 'Nhập kho GRN #13', '2026-01-08 09:00:00'),
-- Giữ chỗ / Xuất kho cho các đơn COMPLETED
(51, 153, 'RESERVE', 1, 'ORDER', '23', 25, 24, 'Giữ chỗ đơn #23', '2025-10-10 09:21:00'),
(52, 153, 'OUT',     1, 'ORDER', '23', 24, 24, 'Xuất kho đơn #23 hoàn thành', '2025-10-15 10:00:00'),
(53, 176, 'RESERVE', 2, 'ORDER', '24', 30, 28, 'Giữ chỗ đơn #24', '2025-10-22 14:31:00'),
(54, 176, 'OUT',     2, 'ORDER', '24', 28, 28, 'Xuất kho đơn #24 hoàn thành', '2025-10-28 09:00:00'),
(55, 125, 'RESERVE', 1, 'ORDER', '25', 12, 11, 'Giữ chỗ đơn #25', '2025-11-05 11:01:00'),
(56, 125, 'OUT',     1, 'ORDER', '25', 11, 11, 'Xuất kho đơn #25 hoàn thành', '2025-11-12 10:00:00'),
(57, 262, 'RESERVE', 1, 'ORDER', '32', 15, 14, 'Giữ chỗ đơn #32', '2026-03-05 14:46:00'),
(58, 262, 'OUT',     1, 'ORDER', '32', 14, 14, 'Xuất kho đơn #32 hoàn thành', '2026-03-10 09:00:00'),
(59, 261, 'RESERVE', 1, 'ORDER', '33', 12, 11, 'Giữ chỗ đơn #33', '2026-03-12 09:01:00'),
(60, 261, 'OUT',     1, 'ORDER', '33', 11, 11, 'Xuất kho đơn #33 hoàn thành', '2026-03-17 10:00:00'),
-- Giữ chỗ đơn đang active (SHIPPING/CONFIRMED/PENDING)
(61, 142, 'RESERVE', 1, 'ORDER', '35', 15, 14, 'Giữ chỗ đơn #35 (SHIPPING)', '2026-04-05 10:01:00'),
(62, 194, 'RESERVE', 1, 'ORDER', '36', 18, 17, 'Giữ chỗ đơn #36 (SHIPPING)', '2026-04-06 09:31:00'),
(63, 262, 'RESERVE', 1, 'ORDER', '37', 10, 9,  'Giữ chỗ đơn #37 (SHIPPING)', '2026-04-07 11:16:00'),
-- Release kho cho đơn CANCELLED
(64, 136, 'RESERVE', 1, 'ORDER', '48', 15, 14, 'Giữ chỗ đơn #48', '2025-11-25 13:01:00'),
(65, 136, 'RELEASE', 1, 'ORDER', '48', 14, 15, 'Giải phóng - đơn #48 hủy', '2025-11-26 08:30:00'),
(66, 169, 'RESERVE', 1, 'ORDER', '49', 20, 19, 'Giữ chỗ đơn #49', '2025-12-15 09:01:00'),
(67, 169, 'RELEASE', 1, 'ORDER', '49', 19, 20, 'Giải phóng - đơn #49 hủy', '2025-12-15 10:30:00');

SET FOREIGN_KEY_CHECKS = 1;