-- Tạo bảng flash_sales
CREATE TABLE flash_sales (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    start_time DATETIME(6) NOT NULL,
    end_time DATETIME(6) NOT NULL,
    is_active BIT(1) DEFAULT b'1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tạo bảng flash_sale_items
CREATE TABLE flash_sale_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    flash_sale_id BIGINT NOT NULL,
    sku_id BIGINT NOT NULL,
    promotional_price DECIMAL(38,2) NOT NULL,
    total_quantity INT NOT NULL,
    sold_quantity INT NOT NULL DEFAULT 0,

    CONSTRAINT fk_fsi_flash_sale FOREIGN KEY (flash_sale_id) REFERENCES flash_sales(id) ON DELETE CASCADE,
    CONSTRAINT fk_fsi_sku FOREIGN KEY (sku_id) REFERENCES skus(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE INDEX idx_flash_sales_active_time ON flash_sales(is_active, start_time, end_time);
CREATE INDEX idx_flash_sale_items_sku ON flash_sale_items(sku_id);