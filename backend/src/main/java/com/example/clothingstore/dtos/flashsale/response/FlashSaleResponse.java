// ══════════════════════════════════════════════════════════════════
// File: dtos/flashsale/response/FlashSaleResponse.java
// ══════════════════════════════════════════════════════════════════
package com.example.clothingstore.dtos.flashsale.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record FlashSaleResponse(
        Long id,
        String name,
        LocalDateTime startTime,
        LocalDateTime endTime,
        boolean isActive,

        /** Derived status: UPCOMING, ACTIVE, ENDED */
        String status,

        List<FlashSaleItemResponse> items
) {
    public record FlashSaleItemResponse(
            Long id,
            Long skuId,
            Long productId,
            String skuCode,
            String productName,
            String variantName,
            String thumbnailUrl,
            BigDecimal originalPrice,
            BigDecimal promotionalPrice,
            Integer totalQuantity,
            Integer soldQuantity,
            Integer remainingQuantity
    ) {}
}