package com.example.clothingstore.mapper;

import com.example.clothingstore.dto.ProductOptionDTO;
import com.example.clothingstore.dto.ProductOptionValueDTO;
import com.example.clothingstore.dto.SkuDTO;
import com.example.clothingstore.dto.response.ProductResponse;
import com.example.clothingstore.entity.Product;
import com.example.clothingstore.entity.ProductOption;
import com.example.clothingstore.entity.ProductOptionValue;
import com.example.clothingstore.entity.Sku;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface ProductMapper {

    // 1. Map từ Product Entity -> ProductResponse
    @Mapping(source = "brand.name", target = "brandName")
    @Mapping(source = "category.name", target = "categoryName")
    @Mapping(source = "options", target = "options") // MapStruct tự hiểu map List -> List
    @Mapping(source = "skus", target = "skus")
    ProductResponse toProductResponse(Product product);

    // 2. Map Option & OptionValue
    ProductOptionDTO toOptionDTO(ProductOption option);

    ProductOptionValueDTO toOptionValueDTO(ProductOptionValue value);

    // 3. Map SKU (Có xử lý logic tạo tên SKU)
    @Mapping(source = "sku", target = "skuName", qualifiedByName = "generateSkuName")
    SkuDTO toSkuDTO(Sku sku);

    // Logic custom để tạo tên SKU (VD: "Đỏ - M")
    // MapStruct cho phép viết hàm Java default ngay trong Interface
    @Named("generateSkuName")
    default String generateSkuName(Sku sku) {
        if (sku.getValues() == null || sku.getValues().isEmpty()) {
            return sku.getCode();
        }
        return sku.getValues().stream()
                .map(v -> v.getOptionValue().getValue())
                .collect(Collectors.joining(" - "));
    }
}
