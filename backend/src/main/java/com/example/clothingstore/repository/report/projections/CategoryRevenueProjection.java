package com.example.clothingstore.repository.report.projections;

import java.math.BigDecimal;

public interface CategoryRevenueProjection {
    Long getCategoryId();
    String getCategoryName();
    Long getOrderCount();
    Long getQuantitySold();
    BigDecimal getRevenue();
}