-- Tạo bảng notifications
CREATE TABLE notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    recipient_id VARCHAR(255) NULL COMMENT 'ID của user nhận, NULL nếu gửi cho toàn bộ Admin',
    title VARCHAR(255) NOT NULL COMMENT 'Tiêu đề thông báo',
    message VARCHAR(255) NOT NULL COMMENT 'Nội dung chi tiết',
    type VARCHAR(50) NOT NULL COMMENT 'Loại thông báo (Enum: NEW_ORDER, LOW_STOCK...)',
    reference_id VARCHAR(255) NULL COMMENT 'ID tham chiếu (orderId, skuId...) để redirect',
    is_read BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Trạng thái đọc',
    created_at DATETIME NOT NULL COMMENT 'Thời gian tạo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo các chỉ mục (Indexes) để tối ưu hóa truy vấn trong NotificationRepository
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(recipient_id, is_read);