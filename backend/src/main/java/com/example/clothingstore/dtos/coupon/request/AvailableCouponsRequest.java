package com.example.clothingstore.dtos.coupon.request;

import java.math.BigDecimal;
import java.util.List;

/**
 * Payload for GET /coupons/available.
 * Sent as query params (simple values) or request body.
 * We use a @RequestBody POST to avoid URL-length limits with many SKUs,
 * but the endpoint is semantically a "query" so we name it clearly.
 */
public record AvailableCouponsRequest(
        BigDecimal orderTotal,
        List<CartItemRef> cartItems
) {
    public record CartItemRef(Long skuId, Long productId, int quantity, BigDecimal price) {}
}