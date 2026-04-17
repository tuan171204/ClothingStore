package com.example.clothingstore.dtos.report;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class TopCustomerDTO {
    private String userId;
    private String fullName;
    private String email;
    private Long totalOrders;
    private BigDecimal totalSpent;
    private LocalDate firstOrderDate;
    private LocalDate lastOrderDate;
    /** Tháng hoạt động = (lastOrder - firstOrder) / 30 */
    private Double customerLifetimeMonths;
    /** CLV = totalSpent / customerLifetimeMonths */
    private BigDecimal estimatedClv;
}