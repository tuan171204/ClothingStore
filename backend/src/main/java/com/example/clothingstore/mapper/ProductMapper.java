package com.example.clothingstore.mapper;

import com.example.clothingstore.dto.ProductOptionDTO;
import com.example.clothingstore.dto.ProductOptionValueDTO;
import com.example.clothingstore.dto.SkuDTO;
import com.example.clothingstore.dto.response.ProductResponse;
import com.example.clothingstore.entity.*;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface ProductMapper {

    // 1. Map từ Product Entity -> ProductResponse
    @Mapping(source = "brand.name", target = "brandName")
    @Mapping(source = "category.name", target = "categoryName")
    @Mapping(source = "options", target = "options") // MapStruct tự hiểu map List -> List
    @Mapping(source = "skus", target = "skus", qualifiedByName = "mapAndSortSkus")
    ProductResponse toProductResponse(Product product);

    // 2. Map Option & OptionValue
    ProductOptionDTO toOptionDTO(ProductOption option);

    ProductOptionValueDTO toOptionValueDTO(ProductOptionValue value);

    // 3. Map SKU (Có xử lý logic tạo tên SKU)
    @Mapping(source = "sku", target = "skuName", qualifiedByName = "generateSkuName")
    @Mapping(source = "values", target = "optionValues") // values (Entity Sku) -> optionValues (SkuDTO)
    @Mapping(source = "code", target = "code")
    SkuDTO toSkuDTO(Sku sku);

    @Mapping(source = "optionValue.id", target = "id")
    @Mapping(source = "optionValue.value", target = "value")
    @Mapping(source = "optionValue.productOption.name", target = "optionName")
    @Mapping(source = "optionValue.isActive", target = "isActive")
    ProductOptionValueDTO mapSkuValueToOptionValueDTO(SkuValue skuValue);

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

    // --- Hàm vừa map vừa sort ---
    @Named("mapAndSortSkus")
    default List<SkuDTO> mapAndSortSkus(List<Sku> skus) {
        if (skus == null) return null;

        return skus.stream()
                .map(this::toSkuDTO) // Map từng thằng Sku -> SkuDTO
                // Sort theo importPrice (xử lý null an toàn: nullsLast)
                .sorted(Comparator.comparing(SkuDTO::getImportPrice, Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());
    }

    default List<ProductOptionValueDTO> mapSkuValuesToOptionValueDTOs(List<SkuValue> skuValues) {
        if (skuValues == null) return null;

        return skuValues.stream()
                .map(sv -> {
                    ProductOptionValueDTO dto = new ProductOptionValueDTO();
                    // Map ID và Value
                    dto.setId(sv.getOptionValue().getId());
                    dto.setValue(sv.getOptionValue().getValue());

                    if (sv.getOptionValue().getProductOption() != null) {
                        dto.setOptionName(sv.getOptionValue().getProductOption().getName());
                    }
                    return dto;
                })
                .collect(Collectors.toList());
    }
}
