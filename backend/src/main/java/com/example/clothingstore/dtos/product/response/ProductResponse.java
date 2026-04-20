package com.example.clothingstore.dtos.product.response;

import com.example.clothingstore.dtos.dto.ProductOptionDTO;
import com.example.clothingstore.dtos.dto.SkuDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    private Long id;
    private String name;
    private String description;
    private BigDecimal basePrice;

    private BigDecimal minPrice;
    private BigDecimal maxPrice;

    private String brandName;
    private String categoryName;
    private String thumbnail;
    private Boolean isActive;

    // List các Option để hiển thị (VD: Màu sắc: [Đỏ, Xanh], Size: [M, L])
    private List<ProductOptionDTO> options;

    // List các SKU để Frontend biết mã nào còn hàng, giá bao nhiêu
    private List<SkuDTO> skus;
}

