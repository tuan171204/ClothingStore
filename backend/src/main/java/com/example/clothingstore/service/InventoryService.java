package com.example.clothingstore.service;

import com.example.clothingstore.dtos.inventory.request.StockAdjustmentRequest;
import com.example.clothingstore.dtos.inventory.request.UpdateLowStockThresholdRequest;
import com.example.clothingstore.dtos.order.response.*;
import com.example.clothingstore.entity.Inventory;
import com.example.clothingstore.entity.Sku;

import java.util.List;

public interface InventoryService {

    /**
     * INV-001: Bootstrap bản ghi Inventory cho SKU nếu chưa có.
     * Được gọi nội bộ từ GoodsReceiptService và OrderService.
     */
    Inventory getOrCreateInventory(Sku sku);

    /**
     * INV-001: Giữ chỗ tồn kho khi đơn hàng được tạo.
     * reserved_quantity += qty; available_quantity -= qty.
     */
    void reserveStock(Long skuId, int quantity);

    /**
     * INV-001: Giải phóng tồn kho đã reserve khi đơn hàng bị hủy.
     * reserved_quantity -= qty; available_quantity += qty.
     */
    void releaseStock(Long skuId, int quantity);

    /**
     * INV-001: Xuất kho thực tế khi đơn hàng hoàn thành.
     * physical_quantity -= qty; reserved_quantity -= qty.
     */
    void deductStock(Long skuId, int quantity);

    /** INV-004: Lấy danh sách SKU có available_quantity < low_stock_threshold. */
    List<InventoryResponse> getLowStockItems();

    /** INV-004: Cập nhật ngưỡng cảnh báo tồn kho thấp cho 1 SKU. */
    InventoryResponse updateLowStockThreshold(Long skuId, UpdateLowStockThresholdRequest request);

    /** INV-005: Điều chỉnh tồn kho thủ công với audit trail. */
    StockAdjustmentResponse adjustStock(StockAdjustmentRequest request);

    /** INV-006: Xem tồn kho hiện tại của 1 SKU cụ thể. */
    InventoryResponse getInventoryBySkuId(Long skuId);

    /** INV-006: Báo cáo tồn kho tổng hợp toàn bộ SKU. */
    StockOnHandResponse getStockOnHand();

    /** INV-006: Lịch sử biến động tồn kho theo SKU. */
    List<StockMovementResponse> getStockMovements(Long skuId);

    /** INV-006: Báo cáo định giá tồn kho (available_quantity * unit_price). */
    InventoryValuationResponse getInventoryValuation();
}