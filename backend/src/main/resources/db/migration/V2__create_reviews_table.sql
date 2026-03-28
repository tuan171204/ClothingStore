CREATE TABLE reviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    sku_id BIGINT,
    user_id VARCHAR(255) NOT NULL,
    rating INT NOT NULL,
    comment TEXT,
    status VARCHAR(20),
    verified_purchase BOOLEAN DEFAULT FALSE,
    created_at DATETIME,
    -- Nếu bạn muốn ràng buộc cứng với bảng products, hãy thêm dòng dưới:
    CONSTRAINT fk_review_product FOREIGN KEY (product_id) REFERENCES products(id)
);