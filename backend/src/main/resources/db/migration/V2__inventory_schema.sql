-- ===========================================================
-- V2__inventory_schema.sql
-- Inventory Management Module (INV-001 → INV-006)
-- ===========================================================

-- INV-001: Bảng tồn kho chính, theo dõi trạng thái stock per SKU
-- available_quantity = physical_quantity - reserved_quantity
CREATE TABLE inventory (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    sku_id              BIGINT          NOT NULL,
    physical_quantity   INT             NOT NULL DEFAULT 0,
    available_quantity  INT             NOT NULL DEFAULT 0,
    reserved_quantity   INT             NOT NULL DEFAULT 0,
    defect_quantity     INT             NOT NULL DEFAULT 0,
    low_stock_threshold INT             NOT NULL DEFAULT 0,

    PRIMARY KEY (id),
    UNIQUE KEY uq_inventory_sku (sku_id),
    CONSTRAINT fk_inventory_sku FOREIGN KEY (sku_id) REFERENCES skus (id) ON DELETE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- INV-002: Header phiếu nhập kho
CREATE TABLE goods_receipts (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    created_by VARCHAR(36),
    status     VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    note       TEXT,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_grn_user FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- INV-002 + INV-003: Dòng hàng trong phiếu nhập với dữ liệu QC
-- Constraint: quantity_passed + quantity_failed = quantity_received (validated at Service layer)
CREATE TABLE goods_receipt_items (
    id                BIGINT NOT NULL AUTO_INCREMENT,
    grn_id            BIGINT NOT NULL,
    sku_id            BIGINT NOT NULL,
    quantity_received INT    NOT NULL,
    quantity_passed   INT    NOT NULL DEFAULT 0,
    quantity_failed   INT    NOT NULL DEFAULT 0,

    PRIMARY KEY (id),
    CONSTRAINT fk_grni_grn FOREIGN KEY (grn_id) REFERENCES goods_receipts (id) ON DELETE CASCADE,
    CONSTRAINT fk_grni_sku FOREIGN KEY (sku_id) REFERENCES skus (id)            ON DELETE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- INV-006: Audit log toàn bộ biến động tồn kho
-- Ghi lại mọi thay đổi available_quantity: IN, OUT, ADJUSTMENT, RESERVE, RELEASE
CREATE TABLE stock_movements (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    sku_id          BIGINT       NOT NULL,
    movement_type   VARCHAR(20)  NOT NULL COMMENT 'IN|OUT|ADJUSTMENT|RESERVE|RELEASE',
    quantity        INT          NOT NULL,
    reference_type  VARCHAR(20)           COMMENT 'ORDER|GRN|ADJUSTMENT',
    reference_id    VARCHAR(100),
    before_quantity INT          NOT NULL,
    after_quantity  INT          NOT NULL,
    note            TEXT,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_movement_sku FOREIGN KEY (sku_id) REFERENCES skus (id) ON DELETE RESTRICT,
    INDEX idx_movement_sku    (sku_id),
    INDEX idx_movement_type   (movement_type),
    INDEX idx_movement_ref    (reference_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- INV-005: Phiếu điều chỉnh tồn kho thủ công, có audit trail
CREATE TABLE stock_adjustments (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    sku_id          BIGINT      NOT NULL,
    adjusted_by     VARCHAR(36),
    quantity_change INT         NOT NULL COMMENT 'Dương = nhập thêm, Âm = xuất bớt',
    reason          TEXT        NOT NULL,
    before_quantity INT         NOT NULL,
    after_quantity  INT         NOT NULL,
    created_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_adj_sku  FOREIGN KEY (sku_id)      REFERENCES skus  (id) ON DELETE RESTRICT,
    CONSTRAINT fk_adj_user FOREIGN KEY (adjusted_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;