package com.example.clothingstore.controller;

import com.example.clothingstore.dto.response.BrandResponse;
import com.example.clothingstore.dto.request.BrandRequest;
import com.example.clothingstore.service.BrandService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("${api.prefix}/brands")
@RequiredArgsConstructor
public class BrandController {
    private final BrandService brandService;

    /**
     * GET /brands?keyword=cool
     */
    @GetMapping
    public ResponseEntity<List<BrandResponse>> getAllBrands(
            @RequestParam(required = false) String keyword
    ) {
        List<BrandResponse> brands = brandService.getAllBrands();
        if (keyword != null && !keyword.trim().isEmpty()) {
            String kw = keyword.trim().toLowerCase();
            brands = brands.stream()
                    .filter(b -> b.getName().toLowerCase().contains(kw))
                    .collect(Collectors.toList());
        }
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