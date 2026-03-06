package com.example.clothingstore.service.impl;

import com.example.clothingstore.dto.ProductOptionDTO;
import com.example.clothingstore.dto.ProductOptionValueDTO;
import com.example.clothingstore.entity.*;
import com.example.clothingstore.mapper.ProductOptionMapper;
import com.example.clothingstore.repository.*;
import com.example.clothingstore.service.ProductOptionService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProductOptionServiceImpl implements ProductOptionService {
    ProductOptionRepository productOptionRepository;
    ProductOptionValueRepository productOptionValueRepository;
    ProductRepository productRepository;
    ProductOptionMapper productOptionMapper;
    SkuValueRepository skuValueRepository;
    SkuRepository skuRepository;

    // 1. LẤY DANH SÁCH THUỘC TÍNH CỦA 1 SẢN PHẨM
    @Override
    public List<ProductOptionDTO> getOptionsByProductId(Long productId) {
        List<ProductOption> options = productOptionRepository.findByProductId(productId);
        return options.stream().map(productOptionMapper::toProductOptionDTO).collect(Collectors.toList());
    }

    // 2. THÊM MỚI 1 THUỘC TÍNH CHO SẢN PHẨM (Kèm các giá trị của nó)
    @Override
    @Transactional
    public ProductOptionDTO createOption(Long productId, ProductOptionDTO request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm ID: " + productId));

        ProductOption option = ProductOption.builder()
                .name(request.getName())
                .product(product)
                .build();

        // Map các giá trị (Red, XL...) vào option
        if (request.getValues() != null && !request.getValues().isEmpty()) {
            List<ProductOptionValue> values = request.getValues().stream().map(v ->
                    ProductOptionValue.builder()
                            .value(v.getValue())
                            .productOption(option)
                            .build()
            ).collect(Collectors.toList());
            option.setValues(values);
        }

        ProductOption savedOption = productOptionRepository.save(option);
        return productOptionMapper.toProductOptionDTO(savedOption);
    }

    // 3. THÊM 1 GIÁ TRỊ MỚI VÀO THUỘC TÍNH ĐÃ CÓ (VD: Thêm màu "Vàng" vào thuộc tính "Màu sắc")
    @Override
    @Transactional
    public ProductOptionValueDTO addValueToOption(Long optionId, ProductOptionValueDTO request) {
        ProductOption option = productOptionRepository.findById(optionId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Thuộc tính ID: " + optionId));

        Product product = option.getProduct();

        // 1. Tạo OptionValue mới (VD: Size XL)
        ProductOptionValue newValue = ProductOptionValue.builder()
                .value(request.getValue())
                .productOption(option)
                .isActive(true)
                .build();
        ProductOptionValue savedValue = productOptionValueRepository.save(newValue);

        // 2. ĐỒNG BỘ MATRIX SKU
        // Tìm các Option khác của Sản phẩm này (VD: Tìm thuộc tính "Màu sắc")
        List<ProductOption> otherOptions = productOptionRepository.findByProductId(product.getId())
                .stream()
                .filter(opt -> !opt.getId().equals(option.getId()))
                .toList();

        if (otherOptions.isEmpty()) {
            // Trường hợp 1: Sản phẩm CHỈ CÓ 1 thuộc tính (Chỉ có Size).
            // Rất đơn giản, tạo 1 SKU mới tinh cho Size XL
            createNewSku(product, List.of(savedValue));
        } else {
            // Trường hợp 2: Sản phẩm có nhiều thuộc tính (Màu sắc x Kích cỡ).
            // VD: otherOptions chứa "Màu sắc" (có Đỏ, Xanh).
            // Tạo 2 SKU: (Đỏ, XL) và (Xanh, XL)

            // Giả sử hệ thống hiện tại hỗ trợ tối đa 2 trục thuộc tính (Phổ biến nhất)
            ProductOption otherOption = otherOptions.get(0);

            for (ProductOptionValue otherValue : otherOption.getValues()) {
                if(otherValue.getIsActive()) { // Chỉ nhân chéo với các màu đang active
                    createNewSku(product, List.of(savedValue, otherValue));
                }
            }
        }

        return ProductOptionValueDTO.builder()
                .id(savedValue.getId())
                .value(savedValue.getValue())
                .optionName(option.getName())
                .build();
    }

    // 3.2 Hàm phụ trợ: Tạo SKU mới và map với các Value
    private void createNewSku(Product product, List<ProductOptionValue> values) {
        String smartSkuCode = generateSmartSkuCode(product, values);

        // Tạo SKU rỗng (Chưa có mã SKU code, giá mặc định lấy từ Base Price)
        Sku newSku = Sku.builder()
                .product(product)
                .code(smartSkuCode)
                .price(product.getBasePrice()) // Lấy giá mặc định của sản phẩm
                .stockQuantity(0) // Tồn kho ban đầu = 0
                .isActive(true)
                .build();

        Sku savedSku = skuRepository.save(newSku);

        // Map SKU này với các giá trị (Tạo SkuValue)
        for (ProductOptionValue val : values) {
            SkuValue skuValue = SkuValue.builder()
                    .sku(savedSku)
                    .optionValue(val)
                    .build();
            skuValueRepository.save(skuValue);
        }
    }

    private String generateSmartSkuCode(Product product, List<ProductOptionValue> values) {
        // Bắt đầu bằng tiền tố SP (Sản phẩm) + ID
        StringBuilder skuCode = new StringBuilder("SP" + product.getId());

        for (ProductOptionValue val : values) {
            if (val != null && val.getValue() != null) {
                // 1. Chuyển thành chữ KHÔNG DẤU
                String normalized = Normalizer.normalize(val.getValue(), Normalizer.Form.NFD);
                Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
                String cleanString = pattern.matcher(normalized).replaceAll("");

                // 2. Viết hoa, xóa khoảng trắng thừa, thay khoảng trắng bằng gạch nối
                String formattedValue = cleanString.toUpperCase()
                        .trim()
                        .replaceAll("\\s+", "-");

                skuCode.append("-").append(formattedValue);
            }
        }
        return skuCode.toString();
    }

    // 4. XÓA 1 THUỘC TÍNH (Sẽ xóa luôn các Option Values bên trong nhờ CascadeType.ALL)
    @Override
    @Transactional
    public void deleteOption(Long optionId) {
        if (!productOptionRepository.existsById(optionId)) {
            throw new RuntimeException("Không tìm thấy Thuộc tính");
        }
        productOptionRepository.deleteById(optionId);
    }


    // 5. XÓA MỀM & CHẶN XÓA (DELETE) 1 GIÁ TRỊ CỤ THỂ (VD: Chỉ xóa màu "Đỏ")
    @Transactional
    public void deleteOptionValue(Long valueId) {
        ProductOptionValue optionValue = productOptionValueRepository.findById(valueId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Giá trị thuộc tính"));

        // 1. Tìm tất cả các Sku đang sử dụng Giá trị này (VD: Các SKU đang có Size S)
        List<SkuValue> skuValues = skuValueRepository.findByOptionValueId(valueId);

        List<Sku> affectedSkus = skuValues.stream()
                .map(SkuValue::getSku)
                .collect(Collectors.toList());

        // 2. Validate: Kiểm tra tồn kho
        for (Sku sku : affectedSkus) {
            if (sku.getStockQuantity() != null && sku.getStockQuantity() > 0) {
                // Ném lỗi cứng, báo về Frontend
                throw new RuntimeException("Không thể ẩn/xóa giá trị '" + optionValue.getValue() + "' vì SKU liên quan vẫn còn " + sku.getStockQuantity() + " sản phẩm trong kho!");
            }
            // TODO: thêm logic check đơn hàng PENDING ở đây
        }

        // 3. Nếu an toàn (Tồn kho = 0) -> Thực hiện XÓA MỀM (Soft Delete)
        optionValue.setIsActive(false); // Ẩn OptionValue
        productOptionValueRepository.save(optionValue);

        for (Sku sku : affectedSkus) {
            sku.setIsActive(false); // Ẩn luôn SKU đó để không hiện lên Web
        }
        skuRepository.saveAll(affectedSkus);
    }
}
