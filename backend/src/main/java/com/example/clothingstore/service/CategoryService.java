package com.example.clothingstore.service;

import com.example.clothingstore.dto.response.CategoryResponse;
import java.util.List;

public interface CategoryService {
    List<CategoryResponse> getAllCategories();
}