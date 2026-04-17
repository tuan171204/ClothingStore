package com.example.clothingstore.repository.report.projections;

import java.math.BigDecimal;

public interface OrderKpiProjection {
    Long getTotalOrders();
    Long getCompletedOrders();
    Long getCancelledOrders();
    Long getPendingOrders();
    BigDecimal getTotalRevenue();
    BigDecimal getAverageOrderValue();
}