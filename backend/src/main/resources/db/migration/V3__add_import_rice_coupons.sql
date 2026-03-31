-- Migration: V3__add_import_price_and_profit_margin.sql
-- Add profit_margin to skus table
ALTER TABLE skus
ADD COLUMN profit_margin DECIMAL(5,2) DEFAULT 10.0 COMMENT 'Tỷ lệ lợi nhuận % (VD: 30.00 = 30%)';

-- Add import_price to goods_receipt_items table
ALTER TABLE goods_receipt_items
ADD COLUMN import_price DECIMAL(15,2) DEFAULT 10.0 COMMENT 'Giá nhập cho lô hàng này (VNĐ)';

-- Index for GRN item lookup by sku + status
CREATE INDEX idx_grni_sku_grn ON goods_receipt_items(sku_id, grn_id);

CREATE TABLE coupons (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL,
    discount_value DECIMAL(19, 2) NOT NULL,
    max_discount_amount DECIMAL(19, 2),
    min_order_value DECIMAL(19, 2),
    apply_type VARCHAR(20) NOT NULL,
    usage_limit INT,
    used_count INT DEFAULT 0,
    start_date DATETIME,
    end_date DATETIME,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE coupon_product (
    coupon_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    PRIMARY KEY (coupon_id, product_id),
    CONSTRAINT fk_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
    CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);