package com.example.clothingstore.controller;

import com.example.clothingstore.dto.response.BrandResponse;
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

    @GetMapping
    public ResponseEntity<List<BrandResponse>> getAllBrands() {
        return ResponseEntity.ok(brandService.getAllBrands());
    }
}