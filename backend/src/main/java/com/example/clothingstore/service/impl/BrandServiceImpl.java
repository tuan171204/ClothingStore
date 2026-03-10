package com.example.clothingstore.service.impl;

import com.example.clothingstore.dto.response.BrandResponse;
import com.example.clothingstore.entity.Brand;
import com.example.clothingstore.exception.AppException;
import com.example.clothingstore.exception.ErrorCode;
import com.example.clothingstore.repository.BrandRepository;
import com.example.clothingstore.service.BrandService;
import com.example.clothingstore.dto.request.BrandRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BrandServiceImpl implements BrandService {
    private final BrandRepository brandRepository;

    @Override
    @Cacheable(value = "brands")
    public List<BrandResponse> getAllBrands() {
        List<Brand> brands = brandRepository.findAll();

        return brands.stream().map(brand -> {
            BrandResponse response = new BrandResponse();
            response.setId(brand.getId());
            response.setName(brand.getName());
            response.setLogo(brand.getLogo());
            return response;
        }).collect(Collectors.toList());
    }

    @Override
    @CacheEvict(value = "brands", allEntries = true)
    public BrandResponse createBrand(BrandRequest request){
        BrandResponse response = new BrandResponse();
        if (brandRepository.existsByName(request.getName())) {
            throw new AppException(ErrorCode.BRAND_ALREADY_EXISTS);
        }
        Brand brand = new Brand();
        brand.setName(request.getName());
        brand.setLogo(request.getLogo());
        Brand savedBrand = brandRepository.save(brand);
        response.setId(savedBrand.getId());
        response.setName(savedBrand.getName());
        response.setLogo(savedBrand.getLogo());
        return response;
    }

    @Override
    @CacheEvict(value = "brands", allEntries = true)
    public BrandResponse updateBrand(Long id, BrandRequest request){
        BrandResponse response = new BrandResponse();
        if (brandRepository.existsByName(request.getName())) {
            throw new AppException(ErrorCode.BRAND_ALREADY_EXISTS);
        }
        Brand brand = brandRepository.findById(id).orElseThrow(() 
        -> new AppException(ErrorCode.BRAND_NOT_FOUND));
        brand.setName(request.getName());
        brand.setLogo(request.getLogo());
        Brand updatedBrand = brandRepository.save(brand);
        response.setId(updatedBrand.getId());
        response.setName(updatedBrand.getName());
        response.setLogo(updatedBrand.getLogo());
        return response;
    }

    @Override
    @CacheEvict(value = "brands", allEntries = true)
    public void deleteBrand(Long id){
        Brand brand = brandRepository.findById(id).orElseThrow(() 
        -> new AppException(ErrorCode.BRAND_NOT_FOUND));
        brandRepository.delete(brand);
    }
}