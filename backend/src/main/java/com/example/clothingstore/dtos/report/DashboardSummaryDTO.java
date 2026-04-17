package com.example.clothingstore.dtos.report;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DashboardSummaryDTO {
    // KPI thẻ tóm tắt
    private BigDecimal revenueToday;
    private BigDecimal revenueThisMonth;
    private BigDecimal revenueThisYear;
    private Long ordersToday;
    private Long ordersThisMonth;
    private Long newCustomersThisMonth;
    private Integer lowStockCount;
    private Integer outOfStockCount;
 
    // So sánh với kỳ trước (%)
    private Double revenueGrowthMonth;  // so với tháng trước
    private Double orderGrowthMonth;
 
    // Biểu đồ nhanh
    private List<RevenueReportDTO> last30DaysRevenue;
    private List<BestSellerDTO> top5Products;
}