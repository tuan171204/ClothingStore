package com.example.clothingstore.dtos.coupon.request;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class ApplyCouponRequest {
    private String code;
    private BigDecimal orderTotal;
    /** SKU IDs and quantities in cart - for PRODUCT-level coupons */
    private List<CartItemRef> cartItems;

    @Data
    public static class CartItemRef {
        private Long skuId;
        private Long productId;
        private int quantity;
        private BigDecimal price;
    }
}