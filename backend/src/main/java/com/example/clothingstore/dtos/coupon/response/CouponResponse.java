package com.example.clothingstore.dtos.coupon.response;

import com.example.clothingstore.entity.Enum.ApplyType;
import com.example.clothingstore.entity.Enum.DiscountType;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CouponResponse {
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
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private boolean isActive;
    
    private Set<Long> appliedProductIds;
} // <--- Đây là dấu ngoặc kết thúc, sau dấu này KHÔNG ĐƯỢC có chữ gì nữa!