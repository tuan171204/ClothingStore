package com.example.clothingstore.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InventoryValuationResponse {
    List<SkuValuationResponse> items;
    BigDecimal totalValue;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class SkuValuationResponse {
        Long skuId;
        String skuCode;
        String productName;
        Integer availableQuantity;
        BigDecimal unitPrice;
        /** inventory_value = availableQuantity * unitPrice */
        BigDecimal totalValue;
    }
}