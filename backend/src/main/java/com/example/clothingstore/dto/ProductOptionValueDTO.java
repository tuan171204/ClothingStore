package com.example.clothingstore.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProductOptionValueDTO {
    private Long id;
    private String value; // Giá trị (Đỏ)
}
