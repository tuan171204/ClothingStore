package com.example.clothingstore.mapper;

import com.example.clothingstore.dtos.supplier.request.SupplierRequest;
import com.example.clothingstore.dtos.supplier.response.SupplierResponse;
import com.example.clothingstore.dtos.supplier.response.SupplierSummaryResponse;
import com.example.clothingstore.entity.Supplier;
import org.mapstruct.*;

/**
 * MapStruct mapper cho Supplier entity ↔ DTO.
 */
@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface SupplierMapper {

    /**
     * Entity → FullResponse (bao gồm số lượng GRN).
     * totalGrnCount được tính riêng trong Service, không map từ field entity.
     */
    @Mapping(target = "totalGrnCount", ignore = true)
    SupplierResponse toResponse(Supplier supplier);

    /** Entity → SummaryResponse (dùng cho dropdown) */
    SupplierSummaryResponse toSummaryResponse(Supplier supplier);

    /**
     * Request → Entity khi TẠO MỚI.
     * id, createdAt, updatedAt, goodsReceipts không map từ request.
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "goodsReceipts", ignore = true)
    Supplier toEntity(SupplierRequest request);

    /**
     * Cập nhật entity từ request (dùng trong PUT).
     * Các field null trong request sẽ KHÔNG ghi đè entity (NullValuePropertyMappingStrategy.IGNORE).
     */
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "goodsReceipts", ignore = true)
    void updateEntityFromRequest(SupplierRequest request, @MappingTarget Supplier supplier);
}