package com.example.clothingstore.dtos.cart.response;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartResponse {
    private List<CartItemResponse> items;
    private BigDecimal totalAmount;
    private int totalItems;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CartItemResponse {
        private Long skuId;
        private Long productId;
        private String productName;
        private String skuCode;
        private String variantName;      // "Đỏ - M"
        private String thumbnailUrl;
        private Integer quantity;
        private BigDecimal price;
        private BigDecimal originalPrice;
        private BigDecimal subtotal;
        private Integer stockAvailable;
        private boolean stockWarning;    // true nếu qty > stock
        private String warningMessage;
    }
}