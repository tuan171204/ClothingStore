package com.example.clothingstore.service;

import com.example.clothingstore.dtos.product.request.ProductRequest;
import com.example.clothingstore.dtos.product.response.ProductListResponse;
import com.example.clothingstore.dtos.product.response.ProductResponse;
import com.example.clothingstore.dtos.product.response.ProductVariantResponse;

import java.math.BigDecimal;
import java.util.List;

public interface ProductService {
    // Lấy danh sách hiển thị trang chủ
    List<ProductResponse> getAllProducts();

    // Lấy chi tiết 1 sản phẩm (kèm options và skus)
    ProductResponse getProductById(Long id);

    // Tìm SKU cụ thể khi khách chọn (VD: Chọn Màu Đỏ + Size M -> Trả về SKU nào?)
    // Input: productId và danh sách các valueId (id của màu Đỏ, id của size M)
    Long getSkuIdByOptions(Long productId, List<Long> selectedValueIds);

    // CRUD
    ProductResponse createProduct(ProductRequest request);
    ProductResponse updateProduct(Long id, ProductRequest request);
    void deleteProduct(Long id);

    ProductListResponse getProductsWithFilter(String keyword,
                                              Long categoryId,
                                              Long brandId,
                                              BigDecimal minPrice, BigDecimal maxPrice,
                                              int page, int limit);

    ProductVariantResponse getVariantMatrix(Long id);
}
