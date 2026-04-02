package com.example.clothingstore.service;

import com.example.clothingstore.dtos.PagedResponse;
import com.example.clothingstore.dtos.brand.response.BrandResponse;
import com.example.clothingstore.dtos.brand.request.BrandRequest;
import java.util.List;

public interface BrandService {
    List<BrandResponse> getAllBrands(String keyword);
    /** @deprecated Use getAllBrands(keyword) */
    @Deprecated
    default List<BrandResponse> getAllBrands() { return getAllBrands(null); }
    PagedResponse<BrandResponse> getBrandsPaged(String keyword, int page, int size);
    BrandResponse createBrand(BrandRequest request);
    BrandResponse updateBrand(Long id, BrandRequest request);
    void deleteBrand(Long id);
}