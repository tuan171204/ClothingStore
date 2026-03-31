package com.example.clothingstore.service;

import com.example.clothingstore.dtos.category.request.CategoryRequest;
import com.example.clothingstore.dtos.category.response.CategoryResponse;

import java.util.List;

public interface CategoryService {
    List<CategoryResponse> getAllCategories();
    CategoryResponse createCategory(CategoryRequest request);
    CategoryResponse updateCategory(Long id, CategoryRequest request);
    void deleteCategory(Long id);
}