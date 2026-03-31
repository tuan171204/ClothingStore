package com.example.clothingstore.service;

import com.example.clothingstore.dtos.gooodsReceipt.request.CreateGoodsReceiptRequest;
import com.example.clothingstore.dtos.gooodsReceipt.request.UpdateGoodsReceiptRequest;
import com.example.clothingstore.dtos.gooodsReceipt.response.GoodsReceiptResponse;

import java.util.List;

public interface GoodsReceiptService {

    /** INV-002: Tạo phiếu nhập kho với trạng thái PENDING. */
    GoodsReceiptResponse createGoodsReceipt(CreateGoodsReceiptRequest request);

    /**
     * Sửa phiếu nhập (chỉ cho phép khi PENDING).
     * Xóa toàn bộ items cũ và tạo lại theo request mới.
     */
    GoodsReceiptResponse updateGoodsReceipt(Long grnId, UpdateGoodsReceiptRequest request);

    /**
     * INV-002 + INV-003: Xác nhận phiếu nhập.
     * - Tính giá nhập bình quân theo công thức weighted average.
     * - Tự động cập nhật giá bán nếu SKU có profitMargin.
     * - Cộng quantity_passed vào physical + available.
     * - Cộng quantity_failed vào defect bucket.
     * - Ghi StockMovement cho từng SKU.
     */
    GoodsReceiptResponse confirmGoodsReceipt(Long grnId);

    /** Lấy chi tiết 1 phiếu nhập kèm tất cả items. */
    GoodsReceiptResponse getGoodsReceiptById(Long id);

    /** Lấy danh sách tất cả phiếu nhập, mới nhất lên đầu. */
    List<GoodsReceiptResponse> getAllGoodsReceipts();
}