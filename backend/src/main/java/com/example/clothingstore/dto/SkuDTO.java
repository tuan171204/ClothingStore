package com.example.clothingstore.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class SkuDTO {
    private Long id;
    private String code;
    private BigDecimal price;
    private BigDecimal importPrice;
    private Integer stockQuantity;
    // Tên hiển thị gợi ý (VD: Màu Đỏ - Size M)
    private String skuName;

    private List<ProductOptionValueDTO> optionValues;
}
