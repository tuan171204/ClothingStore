package com.example.clothingstore.controller;

import com.example.clothingstore.dto.request.CreateGoodsReceiptRequest;
import com.example.clothingstore.dto.response.ApiResponse;
import com.example.clothingstore.dto.response.GoodsReceiptResponse;
import com.example.clothingstore.service.GoodsReceiptService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("${api.prefix}/goods-receipts")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class GoodsReceiptController {

    GoodsReceiptService goodsReceiptService;

    /**
     * GET /api/v1/goods-receipts
     * Lấy danh sách tất cả phiếu nhập kho, mới nhất lên đầu.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<List<GoodsReceiptResponse>> getAllGoodsReceipts() {
        return ApiResponse.<List<GoodsReceiptResponse>>builder()
                .result(goodsReceiptService.getAllGoodsReceipts())
                .build();
    }

    /**
     * GET /api/v1/goods-receipts/{id}
     * Lấy chi tiết 1 phiếu nhập kho kèm toàn bộ items và dữ liệu QC.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<GoodsReceiptResponse> getGoodsReceiptById(@PathVariable Long id) {
        return ApiResponse.<GoodsReceiptResponse>builder()
                .result(goodsReceiptService.getGoodsReceiptById(id))
                .build();
    }

    /**
     * POST /api/v1/goods-receipts
     * Tạo phiếu nhập kho mới với trạng thái PENDING.
     * Tồn kho chưa được cập nhật ở bước này.
     * INV-002 + INV-003
     * Body example:
     * {
     *   "note": "Nhập hàng từ NCC ABC",
     *   "items": [
     *     { "skuId": 1, "quantityReceived": 100, "quantityPassed": 95, "quantityFailed": 5 }
     *   ]
     * }
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<GoodsReceiptResponse> createGoodsReceipt(
            @RequestBody CreateGoodsReceiptRequest request) {
        return ApiResponse.<GoodsReceiptResponse>builder()
                .result(goodsReceiptService.createGoodsReceipt(request))
                .build();
    }

    /**
     * POST /api/v1/goods-receipts/{id}/confirm
     * Xác nhận phiếu nhập: cập nhật tồn kho và ghi StockMovement.
     * - quantity_passed → cộng vào physical_quantity + available_quantity
     * - quantity_failed → cộng vào defect_quantity
     * Chỉ ADMIN/SUPER_ADMIN mới được xác nhận.
     * INV-002 + INV-003
     */
    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<GoodsReceiptResponse> confirmGoodsReceipt(@PathVariable Long id) {
        return ApiResponse.<GoodsReceiptResponse>builder()
                .result(goodsReceiptService.confirmGoodsReceipt(id))
                .build();
    }
}