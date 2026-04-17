package com.example.clothingstore.dtos.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RevenueByCategoryDTO {
    private Long categoryId;
    private String categoryName;
    private Long orderCount;
    private Long quantitySold;
    private BigDecimal revenue;
    private BigDecimal revenueShare;
}