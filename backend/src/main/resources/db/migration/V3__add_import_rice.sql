-- Migration: V3__add_import_price_and_profit_margin.sql
-- Add profit_margin to skus table
ALTER TABLE skus
ADD COLUMN profit_margin DECIMAL(5,2) DEFAULT NULL COMMENT 'Tỷ lệ lợi nhuận % (VD: 30.00 = 30%)';

-- Add import_price to goods_receipt_items table
ALTER TABLE goods_receipt_items
ADD COLUMN import_price DECIMAL(15,2) DEFAULT NULL COMMENT 'Giá nhập cho lô hàng này (VNĐ)';

-- Index for GRN item lookup by sku + status
CREATE INDEX idx_grni_sku_grn ON goods_receipt_items(sku_id, grn_id);