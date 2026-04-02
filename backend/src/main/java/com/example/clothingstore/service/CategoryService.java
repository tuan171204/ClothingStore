package com.example.clothingstore.service;

import com.example.clothingstore.dtos.PagedResponse;
import com.example.clothingstore.dtos.category.request.CategoryRequest;
import com.example.clothingstore.dtos.category.response.CategoryResponse;

import java.util.List;

public interface CategoryService {
    List<CategoryResponse> getAllCategories(String keyword, boolean parentOnly);
    /** @deprecated Use getAllCategories(keyword, parentOnly) */
    @Deprecated
    default List<CategoryResponse> getAllCategories() { return getAllCategories(null, false); }
    PagedResponse<CategoryResponse> getCategoriesPaged(String keyword, boolean parentOnly, int page, int size);
    CategoryResponse createCategory(CategoryRequest request);
    CategoryResponse updateCategory(Long id, CategoryRequest request);
    void deleteCategory(Long id);
}