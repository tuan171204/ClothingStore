package com.example.clothingstore.controller;

import com.example.clothingstore.dtos.ApiResponse;
import com.example.clothingstore.dtos.inventory.request.StockAdjustmentRequest;
import com.example.clothingstore.dtos.inventory.request.UpdateLowStockThresholdRequest;
import com.example.clothingstore.dtos.order.response.*;
import com.example.clothingstore.service.InventoryService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("${api.prefix}/inventory")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class InventoryController {

    InventoryService inventoryService;

    /**
     * GET /api/v1/inventory/sku/{skuId}
     * Xem trạng thái tồn kho đầy đủ của 1 SKU.
     * INV-001
     */
    @GetMapping("/sku/{skuId}")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<InventoryResponse> getInventoryBySkuId(@PathVariable Long skuId) {
        return ApiResponse.<InventoryResponse>builder()
                .result(inventoryService.getInventoryBySkuId(skuId))
                .build();
    }

    /**
     * GET /api/v1/inventory/low-stock
     * Danh sách SKU có available_quantity < low_stock_threshold.
     * INV-004
     */
    @GetMapping("/low-stock")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<List<InventoryResponse>> getLowStockItems() {
        return ApiResponse.<List<InventoryResponse>>builder()
                .result(inventoryService.getLowStockItems())
                .build();
    }

    /**
     * PUT /api/v1/inventory/sku/{skuId}/threshold
     * Body: { "threshold": 10 }
     * Cập nhật ngưỡng cảnh báo tồn kho thấp. threshold = 0 để tắt cảnh báo.
     * INV-004
     */
    @PutMapping("/sku/{skuId}/threshold")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<InventoryResponse> updateLowStockThreshold(
            @PathVariable Long skuId,
            @RequestBody UpdateLowStockThresholdRequest request) {
        return ApiResponse.<InventoryResponse>builder()
                .result(inventoryService.updateLowStockThreshold(skuId, request))
                .build();
    }

    /**
     * POST /api/v1/inventory/adjust
     * Body: { "skuId": 1, "quantityChange": -5, "reason": "Hàng bị hỏng trong kho" }
     * quantityChange > 0: nhập thêm. quantityChange < 0: xuất bớt.
     * INV-005
     */
    @PostMapping("/adjust")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<StockAdjustmentResponse> adjustStock(@RequestBody StockAdjustmentRequest request) {
        return ApiResponse.<StockAdjustmentResponse>builder()
                .result(inventoryService.adjustStock(request))
                .build();
    }

    /**
     * GET /api/v1/inventory/sku/{skuId}/movements
     * Lịch sử biến động tồn kho của 1 SKU (mới nhất lên đầu).
     * INV-006
     */
    @GetMapping("/sku/{skuId}/movements")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<List<StockMovementResponse>> getStockMovements(@PathVariable Long skuId) {
        return ApiResponse.<List<StockMovementResponse>>builder()
                .result(inventoryService.getStockMovements(skuId))
                .build();
    }

    /**
     * GET /api/v1/inventory/report/stock-on-hand
     * Báo cáo tồn kho hiện tại toàn bộ SKU.
     * INV-006
     */
    @GetMapping("/report/stock-on-hand")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<StockOnHandResponse> getStockOnHand() {
        return ApiResponse.<StockOnHandResponse>builder()
                .result(inventoryService.getStockOnHand())
                .build();
    }

    /**
     * GET /api/v1/inventory/report/valuation
     * Báo cáo định giá tồn kho: available_quantity * unit_price.
     * INV-006
     */
    @GetMapping("/report/valuation")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<InventoryValuationResponse> getInventoryValuation() {
        return ApiResponse.<InventoryValuationResponse>builder()
                .result(inventoryService.getInventoryValuation())
                .build();
    }
}