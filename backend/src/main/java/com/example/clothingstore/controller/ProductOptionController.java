package com.example.clothingstore.controller;

import com.example.clothingstore.dtos.dto.ProductOptionDTO;
import com.example.clothingstore.dtos.dto.ProductOptionValueDTO;
import com.example.clothingstore.dtos.ApiResponse;
import com.example.clothingstore.service.ProductOptionService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("${api.prefix}")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProductOptionController {
    ProductOptionService productOptionService;

    // Lấy toàn bộ thuộc tính của 1 sản phẩm
    @GetMapping("/products/{productId}/options")
    public ApiResponse<List<ProductOptionDTO>> getOptionsByProduct(@PathVariable Long productId){
        return ApiResponse.<List<ProductOptionDTO>> builder()
                .result(productOptionService.getOptionsByProductId(productId))
                .build();
    }

    // Thêm mới thuộc tính (Kèm các tùy chọn) cho sản phẩm
    @PostMapping("products/{productId}/options")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<ProductOptionDTO> createOption(@PathVariable Long productId,
                                                      @RequestBody ProductOptionDTO request){
        return ApiResponse.<ProductOptionDTO> builder()
                .result(productOptionService.createOption(productId, request))
                .build();

    }

    // Thêm giá trị mới vào thuộc tính đã có
    @PostMapping("/options/{optionId}/values")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<ProductOptionValueDTO> addValueToOption(@PathVariable Long optionId, @RequestBody ProductOptionValueDTO request) {
        return ApiResponse.<ProductOptionValueDTO>builder()
                .result(productOptionService.addValueToOption(optionId, request))
                .build();
    }

    // Xóa 1 thuộc tính
    @DeleteMapping("/options/{optionId}")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<String> deleteOption(@PathVariable Long optionId) {
        productOptionService.deleteOption(optionId);
        return ApiResponse.<String>builder().result("Đã xóa thuộc tính thành công").build();
    }

    // Xóa 1 giá trị thuộc tính
    @DeleteMapping("/option-values/{valueId}")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<String> deleteOptionValue(@PathVariable Long valueId) {
        productOptionService.deleteOptionValue(valueId);
        return ApiResponse.<String>builder().result("Đã xóa giá trị thành công").build();
    }
}
