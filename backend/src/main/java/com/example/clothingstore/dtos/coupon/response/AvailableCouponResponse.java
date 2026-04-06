package com.example.clothingstore.dtos.coupon.response;

import com.example.clothingstore.entity.Enum.ApplyType;
import com.example.clothingstore.entity.Enum.DiscountType;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Coupon card shown in the "Select Coupon" drawer at checkout.
 * Includes pre-calculated discountAmount so the FE can show savings
 * without calling /coupons/apply for each coupon.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvailableCouponResponse {
    private Long id;
    private String code;
    private String description;
    private DiscountType discountType;
    private BigDecimal discountValue;
    private BigDecimal maxDiscountAmount;
    private BigDecimal minOrderValue;
    private ApplyType applyType;
    private Integer usageLimit;
    private Integer usedCount;
    private LocalDateTime endDate;

    /** Pre-calculated: how much this coupon saves on the current cart */
    private BigDecimal discountAmount;

    /** True when this coupon applies to at least one item in the cart */
    private boolean applicable;

    /** Human-readable reason why not applicable (null when applicable = true) */
    private String notApplicableReason;
}

