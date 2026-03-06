package com.example.clothingstore.service;

import com.example.clothingstore.dto.ProductOptionDTO;
import com.example.clothingstore.dto.ProductOptionValueDTO;
import com.example.clothingstore.entity.ProductOptionValue;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public interface ProductOptionService {
    // Lấy danh sách thuộc tính của 1 sản phẩm
    List<ProductOptionDTO> getOptionsByProductId(Long productId);

    ProductOptionDTO createOption(Long productId, ProductOptionDTO request);

    ProductOptionValueDTO addValueToOption(Long optionId, ProductOptionValueDTO request);

    void deleteOption(Long optionId);

    void deleteOptionValue(Long optionValueId);
}
