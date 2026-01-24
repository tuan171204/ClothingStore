package com.example.clothingstore.dto.response;

import com.example.clothingstore.dto.ProductOptionDTO;
import com.example.clothingstore.dto.SkuDTO;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class ProductResponse {
    private Long id;
    private String name;
    private String description;
    private BigDecimal basePrice;
    private String brandName;
    private String categoryName;
    private String thumbnail;

    // List các Option để hiển thị (VD: Màu sắc: [Đỏ, Xanh], Size: [M, L])
    private List<ProductOptionDTO> options;

    // List các SKU để Frontend biết mã nào còn hàng, giá bao nhiêu
    private List<SkuDTO> skus;
}

