-- ============================================================
-- Migration: V5__add_cancel_return_fields_to_orders.sql
-- Mô tả: Thêm các cột hỗ trợ tính năng Hủy đơn & Hoàn trả
-- ============================================================

-- 1. Cập nhật cột status để chấp nhận 2 giá trị mới
--    MySQL ENUM cần ALTER TABLE để thêm giá trị mới
ALTER TABLE orders
    MODIFY COLUMN status ENUM(
        'PENDING',
        'CONFIRMED',
        'SHIPPING',
        'COMPLETED',
        'CANCELLED',
        'RETURN_REQUESTED',
        'RETURNED'
    ) DEFAULT NULL;

-- 2. Thêm các cột cho tính năng Hủy đơn
ALTER TABLE orders
    ADD COLUMN cancel_reason  VARCHAR(500) NULL
        COMMENT 'Lý do khách hủy đơn',
    ADD COLUMN cancelled_at   DATETIME     NULL
        COMMENT 'Thời điểm đơn bị hủy';

-- 3. Thêm các cột cho tính năng Hoàn trả
ALTER TABLE orders
    ADD COLUMN return_reason       VARCHAR(100) NULL
        COMMENT 'Lý do hoàn trả ngắn gọn (enum value: DEFECTIVE, WRONG_ITEM, ...)',
    ADD COLUMN return_description  TEXT         NULL
        COMMENT 'Mô tả chi tiết từ khách hàng',
    ADD COLUMN return_images       TEXT         NULL
        COMMENT 'JSON array các URL ảnh bằng chứng, VD: ["https://...", "https://..."]',
    ADD COLUMN return_requested_at DATETIME     NULL
        COMMENT 'Thời điểm khách gửi yêu cầu hoàn trả';

-- 4. Index để Admin lọc đơn theo trạng thái mới nhanh hơn
CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_orders_return_requested_at ON orders (return_requested_at);
CREATE INDEX idx_orders_created_at ON orders (created_at);

CREATE INDEX idx_order_items_sku_id ON order_items (sku_id);
CREATE INDEX idx_orders_status_created_at ON orders (status, created_at);
