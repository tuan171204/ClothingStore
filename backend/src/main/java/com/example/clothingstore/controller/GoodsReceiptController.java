package com.example.clothingstore.controller;

import com.example.clothingstore.dtos.gooodsReceipt.request.CreateGoodsReceiptRequest;
import com.example.clothingstore.dtos.gooodsReceipt.request.UpdateGoodsReceiptRequest;
import com.example.clothingstore.dtos.ApiResponse;
import com.example.clothingstore.dtos.PagedResponse;
import com.example.clothingstore.dtos.gooodsReceipt.response.GoodsReceiptResponse;
import com.example.clothingstore.entity.Enum.GrnStatus;
import com.example.clothingstore.service.GoodsReceiptService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("${api.prefix}/goods-receipts")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class GoodsReceiptController {

    GoodsReceiptService goodsReceiptService;

    /**
     * GET /goods-receipts?status=PENDING&fromDate=2026-01-01&toDate=2026-03-31&page=0&size=10
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<PagedResponse<GoodsReceiptResponse>> getAllGoodsReceipts(
            @RequestParam(required = false) GrnStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.<PagedResponse<GoodsReceiptResponse>>builder()
                .result(goodsReceiptService.getAllGoodsReceiptsPaged(status, fromDate, toDate, page, size))
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