-- ============================================================
-- V10: Supplier Module
-- Tạo bảng suppliers và liên kết với goods_receipts
-- ============================================================

CREATE TABLE IF NOT EXISTS suppliers (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    name            VARCHAR(200)    NOT NULL,
    contact_person  VARCHAR(100)    NULL,
    phone           VARCHAR(20)     NULL,
    email           VARCHAR(150)    NULL,
    address         TEXT            NULL,
    tax_code        VARCHAR(20)     NULL COMMENT 'Mã số thuế',
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_supplier_tax_code (tax_code),
    INDEX idx_supplier_name (name),
    INDEX idx_supplier_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Nhà cung cấp / Đối tác nhập hàng';

-- Thêm cột supplier_id vào goods_receipts (nullable để không phá dữ liệu cũ)
ALTER TABLE goods_receipts
    ADD COLUMN supplier_id BIGINT NULL COMMENT 'FK → suppliers.id',
    ADD CONSTRAINT fk_grn_supplier
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
        ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed dữ liệu mẫu
INSERT INTO suppliers (name, contact_person, phone, email, address, tax_code, is_active)
VALUES
    ('Xưởng May Thành Công', 'Nguyễn Văn Thành', '0901234567', 'thanhcong@supplier.vn', '123 Đường Lê Lợi, Quận 1, TP.HCM', '0301234567', 1),
    ('Công ty TNHH Dệt May Phong Phú', 'Trần Thị Hoa', '0912345678', 'phongphu@dệtmay.vn', '456 Đường CMT8, Quận 3, TP.HCM', '0312345678', 1),
    ('Xưởng Sản Xuất Đại Việt', 'Lê Quốc Hùng', '0923456789', 'daiviet@xuong.vn', '789 Đường Nguyễn Trãi, Quận 5, TP.HCM', '0323456789', 1);