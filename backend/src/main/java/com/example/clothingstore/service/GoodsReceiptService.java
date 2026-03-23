package com.example.clothingstore.service;

import com.example.clothingstore.dto.request.CreateGoodsReceiptRequest;
import com.example.clothingstore.dto.response.GoodsReceiptResponse;

import java.util.List;

public interface GoodsReceiptService {

    /** INV-002: Tạo phiếu nhập kho với trạng thái PENDING. */
    GoodsReceiptResponse createGoodsReceipt(CreateGoodsReceiptRequest request);

    /**
     * INV-002 + INV-003: Xác nhận phiếu nhập.
     * Cộng quantity_passed vào physical + available.
     * Cộng quantity_failed vào defect bucket.
     * Ghi StockMovement cho từng SKU.
     */
    GoodsReceiptResponse confirmGoodsReceipt(Long grnId);

    /** Lấy chi tiết 1 phiếu nhập kèm tất cả items. */
    GoodsReceiptResponse getGoodsReceiptById(Long id);

    /** Lấy danh sách tất cả phiếu nhập, mới nhất lên đầu. */
    List<GoodsReceiptResponse> getAllGoodsReceipts();
}