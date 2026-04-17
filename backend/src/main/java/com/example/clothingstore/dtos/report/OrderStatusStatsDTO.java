package com.example.clothingstore.dtos.report;
import lombok.*;

import java.math.BigDecimal;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class OrderStatusStatsDTO {
    private String status;
    private Long count;
    private BigDecimal totalAmount;
    private Double percentage;
}