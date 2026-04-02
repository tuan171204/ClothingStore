package com.example.clothingstore.service.impl;

import com.example.clothingstore.dtos.PagedResponse;
import com.example.clothingstore.dtos.brand.response.BrandResponse;
import com.example.clothingstore.entity.Brand;
import com.example.clothingstore.exception.AppException;
import com.example.clothingstore.exception.ErrorCode;
import com.example.clothingstore.repository.BrandRepository;
import com.example.clothingstore.service.BrandService;
import com.example.clothingstore.dtos.brand.request.BrandRequest;
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
public class BrandServiceImpl implements BrandService {
    private final BrandRepository brandRepository;

    @Override
    @Cacheable(value = "brands")
    public List<BrandResponse> getAllBrands(String keyword) {
        List<Brand> brands;
        if (keyword != null && !keyword.trim().isEmpty()) {
            brands = brandRepository.findByNameContainingIgnoreCase(keyword.trim());
        } else {
            brands = brandRepository.findAll();
        }
        return brands.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public PagedResponse<BrandResponse> getBrandsPaged(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<Brand> brandPage;
        if (keyword != null && !keyword.trim().isEmpty()) {
            brandPage = brandRepository.findByNameContainingIgnoreCase(keyword.trim(), pageable);
        } else {
            brandPage = brandRepository.findAll(pageable);
        }
        return PagedResponse.<BrandResponse>builder()
                .content(brandPage.getContent().stream().map(this::toResponse).collect(Collectors.toList()))
                .page(brandPage.getNumber())
                .size(brandPage.getSize())
                .totalElements(brandPage.getTotalElements())
                .totalPages(brandPage.getTotalPages())
                .first(brandPage.isFirst())
                .last(brandPage.isLast())
                .build();
    }

    @Override
    @CacheEvict(value = "brands", allEntries = true)
    public BrandResponse createBrand(BrandRequest request) {
        if (brandRepository.existsByName(request.getName())) {
            throw new AppException(ErrorCode.BRAND_ALREADY_EXISTS);
        }
        Brand brand = Brand.builder()
                .name(request.getName())
                .logo(request.getLogo())
                .build();
        return toResponse(brandRepository.save(brand));
    }

    @Override
    @CacheEvict(value = "brands", allEntries = true)
    public BrandResponse updateBrand(Long id, BrandRequest request) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.BRAND_NOT_FOUND));
        if (!brand.getName().equals(request.getName()) && brandRepository.existsByName(request.getName())) {
            throw new AppException(ErrorCode.BRAND_ALREADY_EXISTS);
        }
        brand.setName(request.getName());
        brand.setLogo(request.getLogo());
        return toResponse(brandRepository.save(brand));
    }

    @Override
    @CacheEvict(value = "brands", allEntries = true)
    public void deleteBrand(Long id) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.BRAND_NOT_FOUND));
        brandRepository.delete(brand);
    }

    private BrandResponse toResponse(Brand brand) {
        BrandResponse response = new BrandResponse();
        response.setId(brand.getId());
        response.setName(brand.getName());
        response.setLogo(brand.getLogo());
        return response;
    }
}