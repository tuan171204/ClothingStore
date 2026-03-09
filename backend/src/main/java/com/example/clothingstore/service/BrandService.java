package com.example.clothingstore.service;

import com.example.clothingstore.dto.response.BrandResponse;
import com.example.clothingstore.dto.request.BrandRequest;
import java.util.List;

public interface BrandService {
    List<BrandResponse> getAllBrands();
    BrandResponse createBrand(BrandRequest request);
    BrandResponse updateBrand(Long id, BrandRequest request);
    void deleteBrand (Long id);
}