package com.example.clothingstore.service.impl;

import com.example.clothingstore.dtos.PagedResponse;
import com.example.clothingstore.dtos.category.request.CategoryRequest;
import com.example.clothingstore.dtos.category.response.CategoryResponse;
import com.example.clothingstore.entity.Category;
import com.example.clothingstore.exception.AppException;
import com.example.clothingstore.exception.ErrorCode;
import com.example.clothingstore.repository.CategoryRepository;
import com.example.clothingstore.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
        List<Category> categories = categoryRepository.findAll();
        return categories.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public List<CategoryResponse> getAllCategories(String keyword, boolean parentOnly) {
        List<Category> categories;

        boolean hasKeyword = keyword != null && !keyword.trim().isEmpty();

        if (hasKeyword && parentOnly) {
            // Lọc kết hợp: Vừa chứa từ khóa, vừa là danh mục cha
            categories = categoryRepository.findByNameContainingIgnoreCaseAndParentIsNull(keyword.trim());
        } else if (hasKeyword) {
            // Chỉ lọc theo từ khóa
            categories = categoryRepository.findByNameContainingIgnoreCase(keyword.trim());
        } else if (parentOnly) {
            // Chỉ lấy danh mục cha
            categories = categoryRepository.findByParentIsNull();
        } else {
            // Lấy tất cả
            categories = categoryRepository.findAll();
        }

        return categories.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public PagedResponse<CategoryResponse> getCategoriesPaged(String keyword, boolean parentOnly, int page, int size) {
        // Tạo đối tượng Pageable mặc định sắp xếp giảm dần theo ID để category mới tạo lên đầu
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<Category> categoryPage;

        boolean hasKeyword = keyword != null && !keyword.trim().isEmpty();

        if (hasKeyword && parentOnly) {
            // Đẩy SQL query xuống DB để tính toán phân trang chính xác bằng Limit/Offset
            categoryPage = categoryRepository.findByNameContainingIgnoreCaseAndParentIsNull(keyword.trim(), pageable);
        } else if (hasKeyword) {
            categoryPage = categoryRepository.findByNameContainingIgnoreCase(keyword.trim(), pageable);
        } else if (parentOnly) {
            categoryPage = categoryRepository.findByParentIsNull(pageable);
        } else {
            categoryPage = categoryRepository.findAll(pageable);
        }

        // Map từ Entity Page sang DTO List
        List<CategoryResponse> content = categoryPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        // Sử dụng Builder Pattern để build PagedResponse theo chuẩn đã thiết kế
        return PagedResponse.<CategoryResponse>builder()
                .content(content)
                .page(categoryPage.getNumber())
                .size(categoryPage.getSize())
                .totalElements(categoryPage.getTotalElements())
                .totalPages(categoryPage.getTotalPages())
                .last(categoryPage.isLast())
                .first(categoryPage.isFirst())
                .build();
    }

    @Override
    @CacheEvict(value = "categories", allEntries = true)
    public CategoryResponse createCategory(CategoryRequest request) {
        if (categoryRepository.existsByName(request.getName())) {
            throw new AppException(ErrorCode.CATEGORY_ALREADY_EXISTS);
        }

        Category category = new Category();
        category.setName(request.getName());

        if (request.getParentId() != null) {
            Category parent = categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
            category.setParent(parent);
        }

        Category savedCategory = categoryRepository.save(category);
        return mapToResponse(savedCategory);
    }

    @Override
    @CacheEvict(value = "categories", allEntries = true)
    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        // Nếu đổi tên thì check trùng tên
        if (!category.getName().equals(request.getName()) && categoryRepository.existsByName(request.getName())) {
            throw new AppException(ErrorCode.CATEGORY_ALREADY_EXISTS);
        }

        category.setName(request.getName());

        if (request.getParentId() != null) {
            Category parent = categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

            // Validate: Không được chọn chính nó làm thư mục cha (tránh loop)
            if (parent.getId().equals(category.getId())) {
                throw new AppException(ErrorCode.INVALID_DATA); // Hoặc tạo mã lỗi riêng
            }
            category.setParent(parent);
        } else {
            category.setParent(null); // Nếu client truyền null thì gỡ parent
        }

        Category updatedCategory = categoryRepository.save(category);
        return mapToResponse(updatedCategory);
    }

    @Override
    @CacheEvict(value = "categories", allEntries = true)
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        categoryRepository.delete(category);
    }

    // Hàm phụ trợ map entity sang DTO cho code DRY (Don't Repeat Yourself)
    private CategoryResponse mapToResponse(Category cat) {
        CategoryResponse response = new CategoryResponse();
        response.setId(cat.getId());
        response.setName(cat.getName());
        if (cat.getParent() != null) {
            response.setParentId(cat.getParent().getId());
        }
        return response;
    }
}