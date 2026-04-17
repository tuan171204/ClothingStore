package com.example.clothingstore.repository.report.projections;

import java.math.BigDecimal;

public interface OrderStatusProjection {
    String getStatus();
    Long getOrderCount();
    BigDecimal getTotalAmount();
}