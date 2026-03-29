package com.example.clothingstore.dtos.order.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class StockAdjustmentResponse {
    Long id;
    Long skuId;
    String skuCode;
    String adjustedBy;
    Integer quantityChange;
    String reason;
    Integer beforeQuantity;
    Integer afterQuantity;
    LocalDateTime createdAt;
}