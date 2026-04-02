package com.example.clothingstore.dtos.coupon.response;

import lombok.*;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplyCouponResponse {
    private boolean valid;
    private String message;
    private String code;
    private BigDecimal discountAmount;
    private BigDecimal originalTotal;
    private BigDecimal finalTotal;
}