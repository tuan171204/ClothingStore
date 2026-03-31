package com.example.clothingstore.dtos.gooodsReceipt.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class GoodsReceiptItemResponse {
    Long id;
    Long skuId;
    String skuCode;
    String skuName;
    String productName;
    Integer quantityReceived;
    Integer quantityPassed;
    Integer quantityFailed;
    BigDecimal importPrice;
    /** INV-003: defect_rate = quantityFailed / quantityReceived */
    Double defectRate;
}