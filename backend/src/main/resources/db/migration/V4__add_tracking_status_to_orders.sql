-- Migration: V4__add_tracking_status_to_orders.sql
-- Thêm 2 cột để lưu trạng thái vận chuyển chi tiết từ GHN webhook
-- tracking_status : mã trạng thái thô của GHN  (VD: "delivering", "delivered")
-- tracking_message: chuỗi mô tả hiển thị cho khách (VD: "Đang giao hàng tới bạn")

ALTER TABLE orders
    ADD COLUMN tracking_status  VARCHAR(50)  NULL COMMENT 'Trạng thái vận chuyển GHN (raw status code)',
    ADD COLUMN tracking_message VARCHAR(255) NULL COMMENT 'Thông báo vận chuyển hiển thị cho khách hàng';

-- Index để Admin filter nhanh theo trạng thái GHN
CREATE INDEX idx_orders_tracking_status ON orders (tracking_status);