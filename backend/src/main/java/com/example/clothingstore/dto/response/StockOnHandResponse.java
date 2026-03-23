package com.example.clothingstore.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class StockOnHandResponse {
    List<InventoryResponse> items;
    Integer totalSkus;
    Integer totalPhysical;
    Integer totalAvailable;
    Integer totalReserved;
    Integer totalDefect;
}