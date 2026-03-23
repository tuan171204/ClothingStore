package com.example.clothingstore.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class GoodsReceiptItemResponse {
    Long id;
    Long skuId;
    String skuCode;
    String productName;
    Integer quantityReceived;
    Integer quantityPassed;
    Integer quantityFailed;
    /** INV-003: defect_rate = quantityFailed / quantityReceived */
    Double defectRate;
}