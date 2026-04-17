package com.example.clothingstore.repository.report.projections;

import java.math.BigDecimal;

public interface TopCustomerProjection {
    String getUserId();
    String getFullName();
    String getEmail();
    Long getTotalOrders();
    BigDecimal getTotalSpent();
    java.time.LocalDate getFirstOrderDate();
    java.time.LocalDate getLastOrderDate();
}