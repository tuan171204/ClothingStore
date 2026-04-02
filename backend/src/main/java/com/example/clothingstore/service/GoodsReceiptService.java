package com.example.clothingstore.service;

import com.example.clothingstore.dtos.PagedResponse;
import com.example.clothingstore.dtos.gooodsReceipt.request.CreateGoodsReceiptRequest;
import com.example.clothingstore.dtos.gooodsReceipt.request.UpdateGoodsReceiptRequest;
import com.example.clothingstore.dtos.gooodsReceipt.response.GoodsReceiptResponse;
import com.example.clothingstore.entity.Enum.GrnStatus;

import java.time.LocalDate;
import java.util.List;

public interface GoodsReceiptService {

    GoodsReceiptResponse createGoodsReceipt(CreateGoodsReceiptRequest request);

    GoodsReceiptResponse updateGoodsReceipt(Long grnId, UpdateGoodsReceiptRequest request);

    GoodsReceiptResponse confirmGoodsReceipt(Long grnId);

    GoodsReceiptResponse getGoodsReceiptById(Long id);

    /** @deprecated Use getAllGoodsReceiptsPaged */
    @Deprecated
    List<GoodsReceiptResponse> getAllGoodsReceipts();

    /**
     * Paginated list with optional filters
     * @param status    filter by GRN status (null = all)
     * @param fromDate  filter created >= fromDate (null = no lower bound)
     * @param toDate    filter created <= toDate   (null = no upper bound)
     */
    PagedResponse<GoodsReceiptResponse> getAllGoodsReceiptsPaged(
            GrnStatus status, LocalDate fromDate, LocalDate toDate, int page, int size);
}