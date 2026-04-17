package com.example.clothingstore.repository.report.projections;

import java.math.BigDecimal;

public interface BestSellerProjection {
    Long getProductId();
    String getProductName();
    String getThumbnail();
    Long getQuantitySold();
    BigDecimal getRevenue();
    Integer getCurrentStock();
    Integer getRankNum();
}