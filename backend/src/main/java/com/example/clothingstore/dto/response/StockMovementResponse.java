package com.example.clothingstore.dto.response;

import com.example.clothingstore.entity.Enum.StockMovementType;
import com.example.clothingstore.entity.Enum.StockReferenceType;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class StockMovementResponse {
    Long id;
    Long skuId;
    String skuCode;
    StockMovementType movementType;
    Integer quantity;
    StockReferenceType referenceType;
    String referenceId;
    Integer beforeQuantity;
    Integer afterQuantity;
    String note;
    LocalDateTime createdAt;
}
