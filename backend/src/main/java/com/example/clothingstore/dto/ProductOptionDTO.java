package com.example.clothingstore.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductOptionDTO {
    private Long id;
    private String name; // Tên option (Màu sắc)
    private List<ProductOptionValueDTO> values;
}
