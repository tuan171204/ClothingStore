package com.example.clothingstore.dtos.report.response;

import com.example.clothingstore.dtos.report.RevenueReportDTO;

import java.math.BigDecimal;
import java.util.List;

public record SalesComparisonResponse(
        Summary currentPeriod,
        Summary previousPeriod,
        Double revenueGrowthPct,
        Double ordersGrowthPct,
        List<RevenueReportDTO> chartData
) {
    public record Summary(
            BigDecimal totalRevenue,
            Long totalOrders,
            BigDecimal averageOrderValue
    ) {}
}