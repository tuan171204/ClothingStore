package com.example.clothingstore.controller;

import com.example.clothingstore.dtos.ApiResponse;
import com.example.clothingstore.dtos.PagedResponse;
import com.example.clothingstore.dtos.supplier.request.SupplierRequest;
import com.example.clothingstore.dtos.supplier.response.SupplierResponse;
import com.example.clothingstore.dtos.supplier.response.SupplierSummaryResponse;
import com.example.clothingstore.service.SupplierService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller cho module Nhà cung cấp (Supplier).
 *
 * Base URL: /api/v1/suppliers
 *
 * Endpoints:
 *   GET    /                     → Danh sách phân trang (Staff+)
 *   GET    /active-summary        → Dropdown list (Staff+)
 *   GET    /{id}                  → Chi tiết (Staff+)
 *   POST   /                     → Tạo mới (Admin+)
 *   PUT    /{id}                  → Cập nhật (Admin+)
 *   DELETE /{id}                  → Ẩn (Soft delete) (Admin+)
 */
@RestController
@RequestMapping("${api.prefix}/suppliers")
@RequiredArgsConstructor
public class SupplierController {

    private final SupplierService supplierService;

    /**
     * GET /suppliers?keyword=xưởng&activeOnly=true&page=0&size=10
     * Danh sách phân trang với tìm kiếm tổng hợp.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<PagedResponse<SupplierResponse>> getSuppliers(
            @RequestParam(required = false, defaultValue = "") String keyword,
            @RequestParam(required = false, defaultValue = "false") boolean activeOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.<PagedResponse<SupplierResponse>>builder()
                .result(supplierService.getSuppliersWithFilter(keyword, activeOnly, page, size))
                .build();
    }

    /**
     * GET /suppliers/active-summary
     * Danh sách gọn cho dropdown khi tạo GRN — chỉ NCC đang hoạt động.
     */
    @GetMapping("/active-summary")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<List<SupplierSummaryResponse>> getActiveSuppliersSummary() {
        return ApiResponse.<List<SupplierSummaryResponse>>builder()
                .result(supplierService.getActiveSuppliersSummary())
                .build();
    }

    /**
     * GET /suppliers/{id}
     * Chi tiết nhà cung cấp kèm số phiếu nhập đã tạo.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<SupplierResponse> getSupplierById(@PathVariable Long id) {
        return ApiResponse.<SupplierResponse>builder()
                .result(supplierService.getSupplierById(id))
                .build();
    }

    /**
     * POST /suppliers
     * Tạo nhà cung cấp mới.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<SupplierResponse> createSupplier(
            @Valid @RequestBody SupplierRequest request
    ) {
        return ApiResponse.<SupplierResponse>builder()
                .result(supplierService.createSupplier(request))
                .build();
    }

    /**
     * PUT /suppliers/{id}
     * Cập nhật thông tin nhà cung cấp.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<SupplierResponse> updateSupplier(
            @PathVariable Long id,
            @Valid @RequestBody SupplierRequest request
    ) {
        return ApiResponse.<SupplierResponse>builder()
                .result(supplierService.updateSupplier(id, request))
                .build();
    }

    /**
     * DELETE /suppliers/{id}
     * Soft delete — đặt isActive = false, không xóa khỏi DB.
     * Bảo toàn lịch sử phiếu nhập liên quan.
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public void deleteSupplier(@PathVariable Long id) {
        supplierService.deleteSupplier(id);
    }
}