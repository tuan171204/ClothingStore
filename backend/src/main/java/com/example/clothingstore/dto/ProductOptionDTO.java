package com.example.clothingstore.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ProductOptionDTO {
    private Long id;
    private String name; // Tên option (Màu sắc)
    private List<ProductOptionValueDTO> values;
}
