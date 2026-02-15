package com.example.clothingstore.service.impl;

import com.example.clothingstore.dto.response.BrandResponse;
import com.example.clothingstore.entity.Brand;
import com.example.clothingstore.repository.BrandRepository;
import com.example.clothingstore.service.BrandService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BrandServiceImpl implements BrandService {
    private final BrandRepository brandRepository;

    @Override
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
}