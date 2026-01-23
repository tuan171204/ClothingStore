package com.example.clothingstore.service;

import com.example.clothingstore.dto.response.ProductResponse;

import java.util.List;

public interface ProductService {
    // Lấy danh sách hiển thị trang chủ
    List<ProductResponse> getAllProducts();

    // Lấy chi tiết 1 sản phẩm (kèm options và skus)
    ProductResponse getProductById(Long id);

    // Tìm SKU cụ thể khi khách chọn (VD: Chọn Màu Đỏ + Size M -> Trả về SKU nào?)
    // Input: productId và danh sách các valueId (id của màu Đỏ, id của size M)
    Long getSkuIdByOptions(Long productId, List<Long> selectedValueIds);
}
