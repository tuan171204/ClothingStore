package com.example.clothingstore.controller;

import com.example.clothingstore.dtos.PagedResponse;
import com.example.clothingstore.dtos.brand.response.BrandResponse;
import com.example.clothingstore.dtos.brand.request.BrandRequest;
import com.example.clothingstore.service.BrandService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("${api.prefix}/brands")
@RequiredArgsConstructor
public class BrandController {
    private final BrandService brandService;

    /**
     * GET /brands?keyword=cool&page=0&size=10
     * Returns paginated list of brands
     */
    @GetMapping
    public ResponseEntity<?> getAllBrands(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false, defaultValue = "false") boolean paginate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        if (paginate) {
            PagedResponse<BrandResponse> result = brandService.getBrandsPaged(keyword, page, size);
            return ResponseEntity.ok(result);
        }
        // Legacy: return flat list for dropdowns
        List<BrandResponse> brands = brandService.getAllBrands(keyword);
        return ResponseEntity.ok(brands);
    }

    @PostMapping
    public ResponseEntity<BrandResponse> createBrand(@RequestBody BrandRequest request) {
        return ResponseEntity.ok(brandService.createBrand(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BrandResponse> updateBrand(
            @PathVariable Long id, @RequestBody BrandRequest request) {
        return ResponseEntity.ok(brandService.updateBrand(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBrand(@PathVariable Long id) {
        brandService.deleteBrand(id);
        return ResponseEntity.noContent().build();
    }
}