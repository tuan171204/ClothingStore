package com.example.clothingstore.dto.request;

import lombok.Data;

@Data
public class CategoryRequest {
    private String name;
    private Long parentId;
}
