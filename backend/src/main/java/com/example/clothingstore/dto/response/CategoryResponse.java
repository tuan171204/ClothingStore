package com.example.clothingstore.dto.response;

import lombok.Data;

@Data
public class CategoryResponse {
    private Long id;
    private String name;
    private Long parentId; // Chỉ lấy ID cha, không lấy cả object cha để tránh vòng lặp
}