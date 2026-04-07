package com.example.clothingstore.dtos.coupon.request; // Package phải sâu như này mới đúng

import com.example.clothingstore.entity.ApplyType;
import com.example.clothingstore.entity.DiscountType;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CouponRequest {
    private String code;
    private String description;
    private DiscountType discountType;
    private BigDecimal discountValue;
    private BigDecimal maxDiscountAmount;
    private BigDecimal minOrderValue;
    private ApplyType applyType;
    private Integer usageLimit;
    private Set<Long> appliedProductIds;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private boolean isActive;
}