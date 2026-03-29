package com.example.clothingstore.mapper;

import com.example.clothingstore.dtos.dto.ProductOptionDTO;
import com.example.clothingstore.entity.ProductOption;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ProductOptionMapper {
    ProductOptionDTO toProductOptionDTO(ProductOption productOption);
}
