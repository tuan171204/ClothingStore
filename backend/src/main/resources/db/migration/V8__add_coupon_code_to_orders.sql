ALTER TABLE orders
    ADD COLUMN coupon_code VARCHAR(50) NULL
    COMMENT 'Mã coupon đã áp dụng cho đơn hàng';

CREATE INDEX idx_orders_coupon_code ON orders (coupon_code);