-- Migration: V4__add_optimistic_lock_to_inventory.sql
ALTER TABLE inventory
ADD COLUMN version INT NOT NULL DEFAULT 0 COMMENT 'Optimistic lock version';

-- Index cho checkout performance (tránh full scan)
CREATE INDEX idx_inventory_sku_available
ON inventory(sku_id, available_quantity);