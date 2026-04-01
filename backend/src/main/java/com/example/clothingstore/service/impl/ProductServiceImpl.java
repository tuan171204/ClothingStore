package com.example.clothingstore.service.impl;

import com.example.clothingstore.document.ProductDocument;
import com.example.clothingstore.dtos.dto.SkuDTO;
import com.example.clothingstore.dtos.product.request.ProductRequest;
import com.example.clothingstore.dtos.product.response.ProductListResponse;
import com.example.clothingstore.dtos.product.response.ProductResponse;
import com.example.clothingstore.dtos.product.response.ProductVariantResponse;
import com.example.clothingstore.entity.*;
import com.example.clothingstore.entity.Enum.GrnStatus;
import com.example.clothingstore.mapper.ProductMapper;
import com.example.clothingstore.repository.*;
import com.example.clothingstore.repository.search.ProductSearchRepository;
import com.example.clothingstore.repository.specification.ProductSpecification;
import com.example.clothingstore.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductServiceImpl implements ProductService {
    private final ProductRepository productRepository;
    private final ProductOptionRepository optionRepository;
    private final ProductOptionValueRepository optionValueRepository;
    private final SkuRepository skuRepository;
    private final SkuValueRepository skuValueRepository;

    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;
    private final ProductMapper productMapper;

    private final ProductSearchRepository productSearchRepository;
    private final GoodsReceiptItemRepository goodsReceiptItemRepository;

    @Override
    @Cacheable(value = "products")
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
    @CacheEvict(value = "products", allEntries = true) // xóa cache Redis sau khi thêm/sửa/xóa danh sách sản phẩm
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

                BigDecimal margin = skuReq.getProfitMargin() != null ? skuReq.getProfitMargin() : BigDecimal.ZERO;
                sku.setProfitMargin(margin);

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

        // Đồng bộ dữ liệu sang Elasticsearch để phục vụ tìm kiếm
        ProductDocument productDocument = ProductDocument.builder()
                .id(savedProduct.getId())
                .name(savedProduct.getName())
                .build();
        productSearchRepository.save(productDocument);

        return productMapper.toProductResponse(savedProduct);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(value = "products", allEntries = true),
            @CacheEvict(value = "variantMatrix", key = "#productId")
    }) // xóa cache Redis sau khi thêm/sửa/xóa danh sách sản phẩm
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
                        existingSku.setImgUrl(skuReq.getImgUrl());

                        skuRepository.save(existingSku);
                    }
                }
            }
        }

        // Trong Elasticsearch, lệnh save() có ID trùng sẽ tự động ghi đè (Cập nhật
        ProductDocument productDocument = ProductDocument.builder()
                .id(product.getId())
                .name(product.getName())
                .build();
        productSearchRepository.save(productDocument);

        // Lưu sản phẩm cha
        return productMapper.toProductResponse(productRepository.save(product));
    }

    @Override
    @CacheEvict(value = "products", allEntries = true)
    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found: " + id));

        // Check if any SKU of this product has been imported (has GRN items with CONFIRMED status)
        boolean hasImportHistory = product.getSkus().stream()
                .anyMatch(sku -> goodsReceiptItemRepository
                        .existsBySkuIdAndGoodsReceiptStatus(sku.getId(), GrnStatus.CONFIRMED));

        if (hasImportHistory) {
            // Soft delete: mark as inactive
            product.setActive(false);
            productRepository.save(product);
        } else {
            // Hard delete
            productRepository.deleteById(id);
            productSearchRepository.deleteById(id);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public ProductListResponse getProductsWithFilter(String keyword, Long categoryId, Long brandId, BigDecimal minPrice, BigDecimal maxPrice, int page, int limit) {

        List<Long> matchedIds = null; // Danh sách ID lấy từ ES

        // 1. Nếu có từ khóa -> Gọi Elasticsearch
        if (keyword != null && !keyword.trim().isEmpty()) {
            List<ProductDocument> esResults = productSearchRepository.findByNameFuzzy(keyword);

            // Nếu ES không tìm thấy gì -> Trả về rỗng luôn, không cần hỏi MySQL
            if (esResults.isEmpty()) {
                return ProductListResponse.builder()
                        .products(Collections.emptyList())
                        .totalPages(0)
                        .totalElements(0)
                        .build();
            }

            // Rút trích danh sách ID từ kết quả của ES
            matchedIds = esResults.stream()
                    .map(ProductDocument::getId)
                    .collect(Collectors.toList());
        }

        // 1. Tạo Specification (Gắn các điều kiện lọc lại với nhau)
        Specification<Product> spec = Specification.allOf(
                ProductSpecification.hasCategory(categoryId),
                ProductSpecification.hasBrand(brandId),
                ProductSpecification.priceBetween(minPrice, maxPrice),
                // Nếu matchedIds != null tức là có dùng ES, thì thêm điều kiện WHERE id IN (...)
                matchedIds != null ? ProductSpecification.hasIdIn(matchedIds) : null
        );
        // 2. Tạo đối tượng Phân trang (Lưu ý: Spring Boot tính trang đầu tiên là số 0)
        // Mặc định sắp xếp theo sản phẩm mới nhất (ID giảm dần)
        Pageable pageable = PageRequest.of(page, limit, Sort.by("id").descending());

        // 3. Thực thi query xuống Database
        Page<Product> productPage = productRepository.findAll(spec, pageable);

        // 4. Map danh sách Entity sang DTO
        List<ProductResponse> productResponses = productPage.getContent().stream()
                .map(productMapper::toProductResponse)
                .collect(Collectors.toList());

        // 5. Đóng gói vào ProductListResponse
        return ProductListResponse.builder()
                .products(productResponses)
                .totalPages(productPage.getTotalPages())
                .totalElements(productPage.getTotalElements())
                .build();

    }

    @Cacheable(value = "variantMatrix", key = "#productId")
    public ProductVariantResponse getVariantMatrix(Long productId) {
        Product product = productRepository
                .findByIdWithActiveSkusAndValues(productId)
                .orElseThrow(() -> new RuntimeException("Product not found: " + productId));

        // Build option groups (Color: [Red, Blue], Size: [M, L])
        Map<String, LinkedHashSet<String>> optionValueMap = new LinkedHashMap<>();

        List<ProductVariantResponse.SkuMatrix> skuMatrices = product.getSkus().stream()
                .map(sku -> {
                    Map<String, String> optionMap = new LinkedHashMap<>();

                    sku.getValues().forEach(skuValue -> {
                        String optionName = skuValue.getOptionValue().getProductOption().getName();
                        String valueName  = skuValue.getOptionValue().getValue();
                        optionMap.put(optionName, valueName);
                        optionValueMap
                                .computeIfAbsent(optionName, k -> new LinkedHashSet<>())
                                .add(valueName);
                    });

                    boolean inStock = sku.getStockQuantity() != null && sku.getStockQuantity() > 0;

                    return ProductVariantResponse.SkuMatrix.builder()
                            .skuId(sku.getId())
                            .options(optionMap)
                            .inStock(inStock)
                            .stockQuantity(sku.getStockQuantity())
                            .price(sku.getPrice())
                            .imgUrl(sku.getImgUrl())
                            .build();
                })
                .collect(Collectors.toList());

        List<ProductVariantResponse.OptionGroup> optionGroups = optionValueMap.entrySet().stream()
                .map(e -> ProductVariantResponse.OptionGroup.builder()
                        .name(e.getKey())
                        .values(new ArrayList<>(e.getValue()))
                        .build())
                .collect(Collectors.toList());

        return ProductVariantResponse.builder()
                .options(optionGroups)
                .skus(skuMatrices)
                .build();
    }

    @Override
    @Transactional
    public SkuDTO updateSkuProfitMargin(Long skuId, Map<String, Object> body) {
        // 1. Kiểm tra SKU tồn tại
        Sku sku = skuRepository.findById(skuId)
                .orElseThrow(() -> new RuntimeException("SKU không tồn tại"));

        if (!body.containsKey("profitMargin")) {
            throw new RuntimeException("Vui lòng cung cấp tỷ lệ lợi nhuận (profitMargin)");
        }

        try {
            // 2. Parse an toàn giá trị từ Map (tránh ClassCastException do Jackson có thể parse thành Integer/Double)
            BigDecimal newMargin = new BigDecimal(body.get("profitMargin").toString());
            if (newMargin.compareTo(BigDecimal.ZERO) < 0) {
                throw new RuntimeException("Tỷ lệ lợi nhuận không được âm");
            }

            sku.setProfitMargin(newMargin);

            // 3. Tự động tính toán lại Giá Bán (Price) dựa trên Giá Nhập (ImportPrice) mới nhất
            if (sku.getImportPrice() != null && sku.getImportPrice().compareTo(BigDecimal.ZERO) > 0) {
                // Công thức: Giá Bán = Giá Nhập * (1 + ProfitMargin / 100)
                BigDecimal multiplier = BigDecimal.ONE.add(newMargin.divide(BigDecimal.valueOf(100)));
                BigDecimal newPrice = sku.getImportPrice().multiply(multiplier);

                sku.setPrice(newPrice);
            } else {
                // Nếu chưa có giá nhập (hàng chưa từng nhập kho), chỉ lưu margin chờ đợt nhập hàng tiếp theo tự tính
                log.warn("SKU {} chưa có giá nhập kho, chỉ cập nhật Profit Margin", sku.getCode());
            }

            skuRepository.save(sku);

            // 4. Trả về DTO cập nhật mới nhất cho Frontend
            return productMapper.toSkuDTO(sku);

        } catch (NumberFormatException e) {
            throw new RuntimeException("Định dạng profitMargin không hợp lệ");
        }
    }
}
