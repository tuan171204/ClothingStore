package com.example.clothingstore.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductOptionValueDTO {
    private Long id;
    private String value; // Giá trị (Đỏ)
    private String optionName;
}
