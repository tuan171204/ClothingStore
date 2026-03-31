package com.example.clothingstore.dtos.cart;

import lombok.*;
import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartData implements Serializable {
    @Builder.Default
    private List<CartItemData> items = new ArrayList<>();
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CartItemData implements Serializable {
        private Long skuId;
        private Integer quantity;
        private LocalDateTime addedAt;
    }
}