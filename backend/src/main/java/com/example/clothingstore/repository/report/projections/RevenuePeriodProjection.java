package com.example.clothingstore.repository.report.projections;

import java.math.BigDecimal;

/**
 * Interface-based JPA projection.
 * Spring Data maps native query column aliases directly to getter names.
 * WHY use interface projections vs DTO constructor:
 *  - No need for @SqlResultSetMapping boilerplate
 *  - Spring auto-proxies the interface at runtime
 *  - Column name alias in SQL must EXACTLY match getter method (camelCase → snake_case auto-mapped)
 */
public interface RevenuePeriodProjection {
    String getPeriod();
    BigDecimal getRevenue();
    Long getOrderCount();
    BigDecimal getAverageOrderValue();
    BigDecimal getGrossProfit();
}
