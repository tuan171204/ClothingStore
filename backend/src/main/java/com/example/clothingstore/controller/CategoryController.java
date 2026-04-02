package com.example.clothingstore.controller;

import com.example.clothingstore.dtos.PagedResponse;
import com.example.clothingstore.dtos.category.request.CategoryRequest;
import com.example.clothingstore.dtos.category.response.CategoryResponse;
import com.example.clothingstore.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("${api.prefix}/categories")
@RequiredArgsConstructor
public class CategoryController {
    private final CategoryService categoryService;

    /**
     * GET /categories?keyword=ao&parentOnly=true&paginate=true&page=0&size=10
     */
    @GetMapping
    public ResponseEntity<?> getAllCategories(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false, defaultValue = "false") boolean parentOnly,
            @RequestParam(required = false, defaultValue = "false") boolean paginate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        if (paginate) {
            PagedResponse<CategoryResponse> result = categoryService.getCategoriesPaged(keyword, parentOnly, page, size);
            return ResponseEntity.ok(result);
        }
        List<CategoryResponse> categories = categoryService.getAllCategories(keyword, parentOnly);
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