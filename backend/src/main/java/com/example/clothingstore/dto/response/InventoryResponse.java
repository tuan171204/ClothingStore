// ======== InventoryResponse.java ========
package com.example.clothingstore.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InventoryResponse {
    Long id;
    Long skuId;
    String skuCode;
    String productName;
    Integer physicalQuantity;
    Integer availableQuantity;
    Integer reservedQuantity;
    Integer defectQuantity;
    Integer lowStockThreshold;
    boolean lowStock; // true khi availableQuantity < lowStockThreshold
}