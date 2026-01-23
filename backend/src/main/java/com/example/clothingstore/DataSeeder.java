package com.example.clothingstore;

import com.example.clothingstore.entity.*;
import com.example.clothingstore.repository.BrandRepository;
import com.example.clothingstore.repository.CategoryRepository;
import com.example.clothingstore.repository.ProductRepository;
import com.example.clothingstore.repository.SkuValueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Arrays;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;
    private final SkuValueRepository skuValueRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception{
        // Kiểm tra nếu có dữ liệu rồi thì thôi không thêm nữa
        if (productRepository.count() > 0) return;

        System.out.println("----- BẮT ĐẦU TẠO DỮ LIỆU MẪU -----");

        // 1. Tạo Category
        Category catNam = Category.builder().name("Thời trang Nam").build();
        Category catAoThun = Category.builder().name("Áo thun").parent(catNam).build();

        // Lưu cha trước, con sau (hoặc dùng Cascade)
        categoryRepository.save(catNam);
        categoryRepository.save(catAoThun);

        // 2. Tạo Brand
        Brand brand = Brand.builder().name("Coolmate").build();
        brandRepository.save(brand);

        // 3. Tạo Product (Chưa có Option/SKU)
        Product product = Product.builder()
                .name("Áo Thun Cotton Compact")
                .description("Áo thun 100% Cotton, thấm hút mồ hôi.")
                .basePrice(new BigDecimal("150000"))
                .isActive(true)
                .category(catAoThun)
                .brand(brand)
                .build();

        // 4. Tạo Option (Màu & Size)
        ProductOption optColor = ProductOption.builder().name("Màu sắc").product(product).build();
        ProductOptionValue valRed = ProductOptionValue.builder().value("Đỏ").productOption(optColor).build();
        ProductOptionValue valBlue = ProductOptionValue.builder().value("Xanh").productOption(optColor).build();
        optColor.setValues(Arrays.asList(valRed, valBlue));

        ProductOption optSize = ProductOption.builder().name("Kích thước").product(product).build();
        ProductOptionValue valM = ProductOptionValue.builder().value("M").productOption(optSize).build();
        ProductOptionValue valL = ProductOptionValue.builder().value("L").productOption(optSize).build();
        optSize.setValues(Arrays.asList(valM, valL));

        product.setOptions(Arrays.asList(optColor, optSize));

        // 5. Tạo SKU (Biến thể bán)
        // SKU 1: Đỏ - M
        Sku skuRedM = Sku.builder().code("SKU-RED-M").price(new BigDecimal("150000")).stockQuantity(50).product(product).build();
        // SKU 2: Đỏ - L
        Sku skuRedL = Sku.builder().code("SKU-RED-L").price(new BigDecimal("160000")).stockQuantity(40).product(product).build();

        product.setSkus(Arrays.asList(skuRedM, skuRedL));

        // Lưu Product (Nhờ Cascade.ALL, nó sẽ lưu luôn Option, OptionValue và SKU)
        productRepository.save(product);

        // 6. Quan trọng: Tạo SkuValue (Liên kết SKU với OptionValue)
        System.out.println("----- ĐANG TẠO SKU VALUES -----");

        // --- Định nghĩa cho SKU 1 (Đỏ - M) ---
        // SKU 1 có Màu Đỏ (valRed)
        SkuValue sv1 = SkuValue.builder().sku(skuRedM).optionValue(valRed).build();
        // SKU 1 có Size M (valM)
        SkuValue sv2 = SkuValue.builder().sku(skuRedM).optionValue(valM).build();

        // --- Định nghĩa cho SKU 2 (Đỏ - L) ---
        // SKU 2 có Màu Đỏ (valRed)
        SkuValue sv3 = SkuValue.builder().sku(skuRedL).optionValue(valRed).build();
        // SKU 2 có Size L (valL)
        SkuValue sv4 = SkuValue.builder().sku(skuRedL).optionValue(valL).build();

        // Lưu tất cả vào DB
        skuValueRepository.saveAll(Arrays.asList(sv1, sv2, sv3, sv4));

        System.out.println("----- TẠO DỮ LIỆU MẪU THÀNH CÔNG -----");
    }
}
