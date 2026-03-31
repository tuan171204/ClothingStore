package com.example.clothingstore.dtos.category.request;

import lombok.Data;

@Data
public class CategoryRequest {
    private String name;
    private Long parentId;
}
