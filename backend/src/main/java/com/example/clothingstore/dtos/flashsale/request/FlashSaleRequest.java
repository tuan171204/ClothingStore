package com.example.clothingstore.dtos.flashsale.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Full create/update payload for a Flash Sale campaign.
 * Uses Java record for immutability — aligns with the project's DTO standard.
 */
public record FlashSaleRequest(
        String name,

        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
        LocalDateTime startTime,

        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
        LocalDateTime endTime,

        // Same boolean deserialization fix as CouponRequest
        @JsonProperty("isActive")
        boolean isActive,

        List<FlashSaleItemRequest> items
) {
    public record FlashSaleItemRequest(
            Long skuId,
            BigDecimal promotionalPrice,
            Integer totalQuantity
    ) {}
}