package com.example.clothingstore.service;

import com.example.clothingstore.dtos.PagedResponse;
import com.example.clothingstore.dtos.supplier.request.SupplierRequest;
import com.example.clothingstore.dtos.supplier.response.SupplierResponse;
import com.example.clothingstore.dtos.supplier.response.SupplierSummaryResponse;

import java.util.List;

public interface SupplierService {

    SupplierResponse createSupplier(SupplierRequest request);

    SupplierResponse updateSupplier(Long id, SupplierRequest request);

    SupplierResponse getSupplierById(Long id);

    void deleteSupplier(Long id);

    /**
     * Danh sách phân trang với tìm kiếm tổng hợp (tên / email / phone).
     * @param keyword   từ khóa tìm kiếm (null hoặc rỗng = không lọc)
     * @param activeOnly true = chỉ hiện NCC đang hoạt động
     * @param page      trang bắt đầu từ 0
     * @param size      số bản ghi mỗi trang
     */
    PagedResponse<SupplierResponse> getSuppliersWithFilter(
            String keyword, boolean activeOnly, int page, int size);

    List<SupplierSummaryResponse> getActiveSuppliersSummary();
}