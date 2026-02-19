package com.example.clothingstore.service.impl;

import com.example.clothingstore.dto.response.CategoryResponse;
import com.example.clothingstore.entity.Category;
import com.example.clothingstore.repository.CategoryRepository;
import com.example.clothingstore.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {
    private final CategoryRepository categoryRepository;

    @Override
    @Cacheable(value = "categories")
    public List<CategoryResponse> getAllCategories() {
        // Lấy tất cả danh mục (phẳng) để hiển thị trong Dropdown
        List<Category> categories = categoryRepository.findAll();

        return categories.stream().map(cat -> {
            CategoryResponse response = new CategoryResponse();
            response.setId(cat.getId());
            response.setName(cat.getName());
            if (cat.getParent() != null) {
                response.setParentId(cat.getParent().getId());
            }
            return response;
        }).collect(Collectors.toList());
    }
}