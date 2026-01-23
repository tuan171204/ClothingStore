package com.example.clothingstore.service.impl;

import com.example.clothingstore.dto.response.ProductResponse;
import com.example.clothingstore.entity.Product;
import com.example.clothingstore.entity.Sku;
import com.example.clothingstore.mapper.ProductMapper;
import com.example.clothingstore.repository.ProductRepository;
import com.example.clothingstore.repository.SkuRepository;
import com.example.clothingstore.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {
    private final ProductRepository productRepository;
    private final SkuRepository skuRepository;
    private final ProductMapper productMapper;

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> getAllProducts(){
        return productRepository.findAll().stream()
                .map(productMapper::toProductResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getProductById(Long id) {;
        return productRepository.findById(id)
                .map(productMapper::toProductResponse)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm: " + id));
    }

    // --- LOGIC TÌM SKU ---
    @Override
    @Transactional(readOnly = true)
    public Long getSkuIdByOptions(Long productId, List<Long> selectedValue){
        // Bước 1: Lấy tất cả SKU của sản phẩm
        List<Sku> skus = skuRepository.findByProductId(productId);

        // Bước 2: Lọc trên RAM (Java Stream) thay vì query DB phức tạp
        for(Sku sku: skus){
            // Lấy danh sách valueId của SKU hiện tại
            List<Long> skuValueIds = sku.getValues().stream()
                    .map(v -> v.getOptionValue().getId())
                    .toList();

            // So sánh 2 list (Checking if list contents are equal ignore order)
            if (new HashSet<>(skuValueIds).containsAll(selectedValue) && new HashSet<>(selectedValue).containsAll(skuValueIds)){
                return sku.getId();
            }
        }
        throw new RuntimeException("Không tìm thấy biến thể phù hợp");
    }
}
