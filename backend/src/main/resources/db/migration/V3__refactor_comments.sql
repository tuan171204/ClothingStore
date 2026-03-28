-- =============================================================
-- V3: REFACTOR COMMENTS & REVIEWS
-- Tách bạch "Bình luận sản phẩm" và "Đánh giá sau mua hàng"
-- =============================================================

-- 1. Thêm cột order_id vào bảng reviews hiện có
ALTER TABLE reviews
    ADD COLUMN order_id BIGINT NULL AFTER sku_id,
    ADD CONSTRAINT fk_review_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE SET NULL;

-- 2. Thêm index để query nhanh hơn
CREATE INDEX idx_review_user_order ON reviews (user_id, order_id);
CREATE INDEX idx_review_product_status ON reviews (product_id, status);

-- 3. Tạo bảng product_comments (Bình luận / Hỏi đáp)
CREATE TABLE product_comments (
    id          BIGINT          NOT NULL AUTO_INCREMENT,
    product_id  BIGINT          NOT NULL,
    user_id     VARCHAR(255)    NOT NULL,
    content     TEXT            NOT NULL,
    parent_id   BIGINT          NULL                    COMMENT 'NULL = comment gốc, có giá trị = reply',
    status      VARCHAR(20)     NOT NULL DEFAULT 'APPROVED'  COMMENT 'PENDING | APPROVED | REJECTED',
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME        NULL ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_comment_product FOREIGN KEY (product_id)  REFERENCES products (id)            ON DELETE CASCADE,
    CONSTRAINT fk_comment_user    FOREIGN KEY (user_id)     REFERENCES users (id)               ON DELETE CASCADE,
    CONSTRAINT fk_comment_parent  FOREIGN KEY (parent_id)   REFERENCES product_comments (id)    ON DELETE CASCADE,

    INDEX idx_comment_product   (product_id, status),
    INDEX idx_comment_user      (user_id),
    INDEX idx_comment_parent    (parent_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
-- ĐÃ XÓA COLLATE = utf8mb4_unicode_ci ĐỂ MYSQL TỰ LẤY MẶC ĐỊNH