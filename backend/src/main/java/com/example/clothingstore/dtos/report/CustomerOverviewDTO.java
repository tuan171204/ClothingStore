package com.example.clothingstore.dtos.report;

import lombok.*;

import java.math.BigDecimal;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CustomerOverviewDTO {
    private Long totalCustomers;
    private Long newCustomers;      // Đặt đơn đầu tiên trong kỳ
    private Long returningCustomers;// Đặt từ 2 đơn trở lên
    private Double retentionRate;   // returning / total * 100
    private BigDecimal averageClv;
}