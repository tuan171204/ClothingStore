package com.example.clothingstore.dtos.category.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryResponse {
    private Long id;
    private String name;
    private Long parentId; // Chỉ lấy ID cha, không lấy cả object cha để tránh vòng lặp
}