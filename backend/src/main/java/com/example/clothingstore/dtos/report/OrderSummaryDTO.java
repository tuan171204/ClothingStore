package com.example.clothingstore.dtos.report;

import lombok.*;

import java.math.BigDecimal;

@Data
@Builder @NoArgsConstructor @AllArgsConstructor
public class OrderSummaryDTO {
    private Long totalOrders;
    private Long completedOrders;
    private Long cancelledOrders;
    private Long pendingOrders;
    private BigDecimal totalRevenue;
    private BigDecimal averageOrderValue;
    private Double conversionRate;
    private java.util.List<OrderStatusStatsDTO> byStatus;
}