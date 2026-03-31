package com.example.clothingstore.dtos.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SkuDTO {
    Long id;
    String code;
    BigDecimal price;
    BigDecimal importPrice;
    Integer stockQuantity;
    BigDecimal profitMargin;
    // Tên hiển thị gợi ý (VD: Màu Đỏ - Size M)
    String skuName;
    Boolean isActive;
    String imgUrl;

    List<ProductOptionValueDTO> optionValues;
}
