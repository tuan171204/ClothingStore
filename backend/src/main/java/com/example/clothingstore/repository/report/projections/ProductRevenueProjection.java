package com.example.clothingstore.repository.report.projections;

import java.math.BigDecimal;

public interface ProductRevenueProjection {
    Long getProductId();
    String getProductName();
    String getCategoryName();
    String getBrandName();
    Long getQuantitySold();
    BigDecimal getRevenue();
}
