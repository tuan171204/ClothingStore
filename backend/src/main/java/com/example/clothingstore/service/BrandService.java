package com.example.clothingstore.service;

import com.example.clothingstore.dto.response.BrandResponse;
import java.util.List;

public interface BrandService {
    List<BrandResponse> getAllBrands();
}