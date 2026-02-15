package com.example.clothingstore.service.impl;

import com.example.clothingstore.dto.request.ProductRequest;
import com.example.clothingstore.dto.response.ProductResponse;
import com.example.clothingstore.entity.*;
import com.example.clothingstore.mapper.ProductMapper;
import com.example.clothingstore.repository.*;
import com.example.clothingstore.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {
    private final ProductRepository productRepository;
    private final ProductOptionRepository optionRepository;
    private final ProductOptionValueRepository optionValueRepository;
    private final SkuRepository skuRepository;
    private final SkuValueRepository skuValueRepository;

    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;
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

    // --- TẠO SẢN PHẨM ---
    @Override
    @Transactional // Quan trọng: Để rollback nếu lưu SKU lỗi
    public ProductResponse createProduct(ProductRequest request) {
        // 1. Lưu Product (Cha)
        Product product = new Product();
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setBasePrice(request.getBasePrice());
        product.setThumbnail(request.getThumbnail());
        product.setActive(true);

        if (request.getCategoryId() != null) {
            product.setCategory(categoryRepository.findById(request.getCategoryId()).orElse(null));
        }
        if (request.getBrandId() != null) {
            product.setBrand(brandRepository.findById(request.getBrandId()).orElse(null));
        }

        Product savedProduct = productRepository.save(product);

        // 2. Lưu Options & Option Values
        // Cần lưu lại danh sách Value đã tạo để tí nữa map vào SKU
        List<ProductOptionValue> allSavedValues = new ArrayList<>();

        if (request.getOptions() != null) {
            for (ProductRequest.OptionRequest optReq : request.getOptions()) {
                ProductOption option = new ProductOption();
                option.setName(optReq.getName());
                option.setProduct(savedProduct);
                ProductOption savedOption = optionRepository.save(option);

                if (optReq.getValues() != null) {
                    for (ProductRequest.OptionValueRequest valReq : optReq.getValues()) {
                        ProductOptionValue val = new ProductOptionValue();
                        val.setProductOption(savedOption);
                        val.setValue(valReq.getValue());
                        allSavedValues.add(optionValueRepository.save(val));
                    }
                }
            }
        }

        // 3. Lưu SKUs & Sku Values
        if (request.getSkus() != null) {
            for (ProductRequest.SkuRequest skuReq : request.getSkus()) {
                Sku sku = new Sku();
                sku.setProduct(savedProduct);
                sku.setCode(skuReq.getCode());
                sku.setPrice(skuReq.getPrice());
                sku.setImportPrice(skuReq.getImportPrice());
                sku.setStockQuantity(skuReq.getStockQuantity());
                Sku savedSku = skuRepository.save(sku);

                // Map SKU với Option Values tương ứng
                if (skuReq.getOptionValues() != null) {
                    for (ProductRequest.SkuOptionValueRequest skuValReq : skuReq.getOptionValues()) {
                        // Tìm OptionValue đã lưu ở bước 2 khớp với tên option và giá trị
                        Optional<ProductOptionValue> matchVal = allSavedValues.stream()
                                .filter(v -> v.getProductOption().getName().equals(skuValReq.getOptionName())
                                        && v.getValue().equals(skuValReq.getValue()))
                                .findFirst();

                        if (matchVal.isPresent()) {
                            SkuValue skuValue = new SkuValue();
                            skuValue.setSku(savedSku);
                            skuValue.setOptionValue(matchVal.get());
                            skuValueRepository.save(skuValue);
                        }
                    }
                }
            }
        }
        return productMapper.toProductResponse(savedProduct);
    }

    @Override
    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        // 1. Tìm sản phẩm
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm: " + id));

        // 2. Cập nhật thông tin cơ bản
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setBasePrice(request.getBasePrice());
        product.setThumbnail(request.getThumbnail());

        if (request.getCategoryId() != null) {
            product.setCategory(categoryRepository.findById(request.getCategoryId()).orElse(null));
        }
        if (request.getBrandId() != null) {
            product.setBrand(brandRepository.findById(request.getBrandId()).orElse(null));
        }

        // 3. Cập nhật SKU (Giá nhập, Giá bán, Tồn kho)
        // Lưu ý: Ở chức năng Sửa đơn giản, ta chỉ update các SKU đã có (dựa theo Code hoặc ID nếu có)
        if (request.getSkus() != null) {
            for (ProductRequest.SkuRequest skuReq : request.getSkus()) {
                if (skuReq.getCode() != null) {
                    // Tìm SKU cũ theo Code (Mã SKU là duy nhất)
                    Optional<Sku> existingSkuOpt = skuRepository.findByCode(skuReq.getCode());

                    if (existingSkuOpt.isPresent()) {
                        Sku existingSku = existingSkuOpt.get();
                        existingSku.setPrice(skuReq.getPrice());
                        existingSku.setImportPrice(skuReq.getImportPrice());
                        existingSku.setStockQuantity(skuReq.getStockQuantity());

                        skuRepository.save(existingSku);
                    }
                }
            }
        }

        // Lưu sản phẩm cha
        return productMapper.toProductResponse(productRepository.save(product));
    }

    @Override
    @Transactional
    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new RuntimeException("Product not found");
        }

        productRepository.deleteById(id);
    }
}
