package com.example.clothingstore.controller;

import com.example.clothingstore.dtos.gooodsReceipt.request.CreateGoodsReceiptRequest;
import com.example.clothingstore.dtos.gooodsReceipt.request.UpdateGoodsReceiptRequest;
import com.example.clothingstore.dtos.ApiResponse;
import com.example.clothingstore.dtos.gooodsReceipt.response.GoodsReceiptResponse;
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

    @GetMapping
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<List<GoodsReceiptResponse>> getAllGoodsReceipts() {
        return ApiResponse.<List<GoodsReceiptResponse>>builder()
                .result(goodsReceiptService.getAllGoodsReceipts())
                .build();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<GoodsReceiptResponse> getGoodsReceiptById(@PathVariable Long id) {
        return ApiResponse.<GoodsReceiptResponse>builder()
                .result(goodsReceiptService.getGoodsReceiptById(id))
                .build();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<GoodsReceiptResponse> createGoodsReceipt(
            @RequestBody CreateGoodsReceiptRequest request) {
        return ApiResponse.<GoodsReceiptResponse>builder()
                .result(goodsReceiptService.createGoodsReceipt(request))
                .build();
    }

    /**
     * PUT /api/v1/goods-receipts/{id}
     * Sửa phiếu nhập (chỉ khi PENDING).
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<GoodsReceiptResponse> updateGoodsReceipt(
            @PathVariable Long id,
            @RequestBody UpdateGoodsReceiptRequest request) {
        return ApiResponse.<GoodsReceiptResponse>builder()
                .result(goodsReceiptService.updateGoodsReceipt(id, request))
                .build();
    }

    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<GoodsReceiptResponse> confirmGoodsReceipt(@PathVariable Long id) {
        return ApiResponse.<GoodsReceiptResponse>builder()
                .result(goodsReceiptService.confirmGoodsReceipt(id))
                .build();
    }
}