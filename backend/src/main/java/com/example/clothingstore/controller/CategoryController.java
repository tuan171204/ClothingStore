package com.example.clothingstore.controller;

import com.example.clothingstore.dto.request.CategoryRequest;
import com.example.clothingstore.dto.response.CategoryResponse;
import com.example.clothingstore.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("${api.prefix}/categories")
@RequiredArgsConstructor
public class CategoryController {
    private final CategoryService categoryService;

    /**
     * GET /categories?keyword=ao&parentOnly=true
     * parentOnly=true → chỉ trả danh mục gốc (parent_id IS NULL)
     */
    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getAllCategories(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false, defaultValue = "false") boolean parentOnly
    ) {
        List<CategoryResponse> categories = categoryService.getAllCategories();

        if (parentOnly) {
            categories = categories.stream()
                    .filter(c -> c.getParentId() == null)
                    .collect(Collectors.toList());
        }

        if (keyword != null && !keyword.trim().isEmpty()) {
            String kw = keyword.trim().toLowerCase();
            categories = categories.stream()
                    .filter(c -> c.getName().toLowerCase().contains(kw))
                    .collect(Collectors.toList());
        }

        return ResponseEntity.ok(categories);
    }

    @PostMapping
    public ResponseEntity<CategoryResponse> createCategory(@RequestBody CategoryRequest request) {
        return ResponseEntity.ok(categoryService.createCategory(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponse> updateCategory(
            @PathVariable Long id, @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(categoryService.updateCategory(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }
}