package com.example.clothingstore.service;

import com.example.clothingstore.dtos.brand.response.BrandResponse;
import com.example.clothingstore.dtos.brand.request.BrandRequest;
import java.util.List;

public interface BrandService {
    List<BrandResponse> getAllBrands();
    BrandResponse createBrand(BrandRequest request);
    BrandResponse updateBrand(Long id, BrandRequest request);
    void deleteBrand (Long id);
}