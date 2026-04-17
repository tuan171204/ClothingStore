package com.example.clothingstore.repository.report.projections;

public interface CustomerOverviewProjection {
    Long getTotalActiveCustomers();
    Long getNewCustomers();
    Long getReturningCustomers();
}