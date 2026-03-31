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
