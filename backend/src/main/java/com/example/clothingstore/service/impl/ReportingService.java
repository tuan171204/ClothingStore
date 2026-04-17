// ============================================================
// FILE: service/impl/ReportingService.java
// ============================================================
package com.example.clothingstore.service.impl;

import com.example.clothingstore.dtos.report.*;
import com.example.clothingstore.repository.InventoryRepository;
import com.example.clothingstore.repository.ReportRepository;
import com.example.clothingstore.repository.report.projections.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

/**
 * All reporting methods are READ-ONLY (@Transactional(readOnly = true)).
 * Heavy reports (monthly, yearly) are cached in Redis with TTL configured in RedisConfig.
 *
 * Cache invalidation: reports are TTL-based (60 min by default).
 * For real-time dashboards, skip caching or use 5-min TTL.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportingService {

    private final ReportRepository reportRepository;
    private final InventoryRepository inventoryRepository;

    // ════════════════════════════════════════════════════════
    // DASHBOARD SUMMARY
    // ════════════════════════════════════════════════════════

    /**
     * Single API for Admin dashboard overview card.
     * Fetches today's KPIs + growth vs previous period.
     *
     * NOT cached because it should reflect real-time today's data.
     */
    public DashboardSummaryDTO getDashboardSummary() {
        LocalDateTime now = LocalDateTime.now();

        // Today range
        LocalDateTime todayStart = now.toLocalDate().atStartOfDay();
        LocalDateTime todayEnd   = now;

        // This month
        LocalDateTime monthStart = now.withDayOfMonth(1).toLocalDate().atStartOfDay();

        // Last month (for growth comparison)
        LocalDateTime lastMonthStart = monthStart.minusMonths(1);
        LocalDateTime lastMonthEnd   = monthStart.minusSeconds(1);

        // This year
        LocalDateTime yearStart = now.withDayOfYear(1).toLocalDate().atStartOfDay();

        // ── Fetch KPIs ─────────────────────────────────────
        BigDecimal revenueToday     = reportRepository.findTotalRevenueBetween(todayStart, todayEnd);
        BigDecimal revenueThisMonth = reportRepository.findTotalRevenueBetween(monthStart, now);
        BigDecimal revenueLastMonth = reportRepository.findTotalRevenueBetween(lastMonthStart, lastMonthEnd);
        BigDecimal revenueThisYear  = reportRepository.findTotalRevenueBetween(yearStart, now);

        Long ordersToday     = reportRepository.findOrderCountBetween(todayStart, todayEnd);
        Long ordersThisMonth = reportRepository.findOrderCountBetween(monthStart, now);
        Long ordersLastMonth = reportRepository.findOrderCountBetween(lastMonthStart, lastMonthEnd);

        Long newCustomersThisMonth = reportRepository.findNewCustomerCount(monthStart, now);

        // Low/out-of-stock count from inventory
        int lowStockCount    = inventoryRepository.findLowStockItems().size();
        int outOfStockCount  = (int) inventoryRepository.findAll().stream()
                .filter(i -> i.getAvailableQuantity() == 0)
                .count();

        // ── Growth rate calculation ─────────────────────────
        Double revenueGrowthMonth = calcGrowthRate(revenueLastMonth, revenueThisMonth);
        Double orderGrowthMonth   = calcGrowthRate(
                BigDecimal.valueOf(ordersLastMonth == null ? 0 : ordersLastMonth),
                BigDecimal.valueOf(ordersThisMonth == null ? 0 : ordersThisMonth)
        );

        // ── Last 30 days for mini chart ─────────────────────
        LocalDateTime thirtyDaysAgo = now.minusDays(30);
        List<RevenueReportDTO> last30Days = reportRepository
                .findDailyRevenue(thirtyDaysAgo, now)
                .stream()
                .map(this::mapRevenuePeriod)
                .collect(Collectors.toList());

        // ── Top 5 products ──────────────────────────────────
        List<BestSellerDTO> top5 = reportRepository
                .findBestSellers(monthStart, now, 5)
                .stream()
                .map(this::mapBestSeller)
                .collect(Collectors.toList());

        return DashboardSummaryDTO.builder()
                .revenueToday(safe(revenueToday))
                .revenueThisMonth(safe(revenueThisMonth))
                .revenueThisYear(safe(revenueThisYear))
                .ordersToday(safe(ordersToday))
                .ordersThisMonth(safe(ordersThisMonth))
                .newCustomersThisMonth(safe(newCustomersThisMonth))
                .lowStockCount(lowStockCount)
                .outOfStockCount(outOfStockCount)
                .revenueGrowthMonth(revenueGrowthMonth)
                .orderGrowthMonth(orderGrowthMonth)
                .last30DaysRevenue(last30Days)
                .top5Products(top5)
                .build();
    }

    // ════════════════════════════════════════════════════════
    // REVENUE REPORTS
    // ════════════════════════════════════════════════════════

    /**
     * Daily revenue for a date range (max 90 days recommended for performance).
     * Cached per date range key.
     */
    @Cacheable(value = "report_daily_revenue", key = "#from + '_' + #to")
    public List<RevenueReportDTO> getDailyRevenue(LocalDate from, LocalDate to) {
        validateDateRange(from, to, 90);

        LocalDateTime fromDt = from.atStartOfDay();
        LocalDateTime toDt   = to.atTime(23, 59, 59);

        return reportRepository.findDailyRevenue(fromDt, toDt)
                .stream()
                .map(this::mapRevenuePeriod)
                .collect(Collectors.toList());
    }

    /**
     * Monthly revenue for a given year.
     * Cached per year — valid for historical years, invalidated hourly for current year.
     */
    @Cacheable(value = "report_monthly_revenue", key = "#year")
    public List<RevenueReportDTO> getMonthlyRevenue(int year) {
        return reportRepository.findMonthlyRevenue(year)
                .stream()
                .map(this::mapRevenuePeriod)
                .collect(Collectors.toList());
    }

    /**
     * Yearly revenue since a given year.
     */
    @Cacheable(value = "report_yearly_revenue", key = "#fromYear")
    public List<RevenueReportDTO> getYearlyRevenue(int fromYear) {
        return reportRepository.findYearlyRevenue(fromYear)
                .stream()
                .map(this::mapRevenuePeriod)
                .collect(Collectors.toList());
    }

    /**
     * Top N products by revenue in a date range.
     * WHY: Flash Sale selection, restock priority.
     */
    @Cacheable(value = "report_revenue_by_product", key = "#from + '_' + #to + '_' + #topN")
    public List<RevenueByProductDTO> getRevenueByProduct(LocalDate from, LocalDate to, int topN) {
        // First fetch total revenue for percentage calculation
        LocalDateTime fromDt = from.atStartOfDay();
        LocalDateTime toDt   = to.atTime(23, 59, 59);

        BigDecimal totalRevenue = safe(reportRepository.findTotalRevenueBetween(fromDt, toDt));
        if (totalRevenue.compareTo(BigDecimal.ZERO) == 0) return Collections.emptyList();

        return reportRepository.findRevenueByProduct(fromDt, toDt, topN)
                .stream()
                .map(p -> RevenueByProductDTO.builder()
                        .productId(p.getProductId())
                        .productName(p.getProductName())
                        .categoryName(p.getCategoryName())
                        .brandName(p.getBrandName())
                        .quantitySold(p.getQuantitySold())
                        .revenue(p.getRevenue())
                        .revenueShare(p.getRevenue()
                                .divide(totalRevenue, 4, RoundingMode.HALF_UP)
                                .multiply(BigDecimal.valueOf(100))
                                .setScale(2, RoundingMode.HALF_UP))
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Revenue by category with share percentage.
     */
    @Cacheable(value = "report_revenue_by_category", key = "#from + '_' + #to")
    public List<RevenueByCategoryDTO> getRevenueByCategory(LocalDate from, LocalDate to) {
        LocalDateTime fromDt = from.atStartOfDay();
        LocalDateTime toDt   = to.atTime(23, 59, 59);

        BigDecimal totalRevenue = safe(reportRepository.findTotalRevenueBetween(fromDt, toDt));

        return reportRepository.findRevenueByCategory(fromDt, toDt)
                .stream()
                .map(c -> RevenueByCategoryDTO.builder()
                        .categoryId(c.getCategoryId())
                        .categoryName(c.getCategoryName())
                        .orderCount(c.getOrderCount())
                        .quantitySold(c.getQuantitySold())
                        .revenue(c.getRevenue())
                        .revenueShare(totalRevenue.compareTo(BigDecimal.ZERO) == 0
                                ? BigDecimal.ZERO
                                : c.getRevenue()
                                .divide(totalRevenue, 4, RoundingMode.HALF_UP)
                                .multiply(BigDecimal.valueOf(100))
                                .setScale(2, RoundingMode.HALF_UP))
                        .build())
                .collect(Collectors.toList());
    }

    // ════════════════════════════════════════════════════════
    // ORDER REPORTS
    // ════════════════════════════════════════════════════════

    /**
     * Order summary: conversion rate, AOV, status breakdown.
     * WHY: conversion rate = completed/total → UX health metric.
     *      High PENDING count → operational issue.
     */
    public OrderSummaryDTO getOrderSummary(LocalDate from, LocalDate to) {
        LocalDateTime fromDt = from.atStartOfDay();
        LocalDateTime toDt   = to.atTime(23, 59, 59);

        OrderKpiProjection kpi = reportRepository.findOrderKpis(fromDt, toDt);
        List<OrderStatusProjection> byStatus = reportRepository.findOrderCountByStatus(fromDt, toDt);

        long total = kpi.getTotalOrders() == null ? 0 : kpi.getTotalOrders();
        long completed = kpi.getCompletedOrders() == null ? 0 : kpi.getCompletedOrders();

        // Conversion rate: (completed / total) * 100
        double conversionRate = total == 0 ? 0.0
                : Math.round((completed * 100.0 / total) * 100.0) / 100.0;

        List<OrderStatusStatsDTO> statusDtos = byStatus.stream()
                .map(s -> {
                    double pct = total == 0 ? 0
                            : Math.round((s.getOrderCount() * 100.0 / total) * 100.0) / 100.0;
                    return OrderStatusStatsDTO.builder()
                            .status(s.getStatus())
                            .count(s.getOrderCount())
                            .totalAmount(s.getTotalAmount())
                            .percentage(pct)
                            .build();
                })
                .collect(Collectors.toList());

        return OrderSummaryDTO.builder()
                .totalOrders(kpi.getTotalOrders())
                .completedOrders(kpi.getCompletedOrders())
                .cancelledOrders(kpi.getCancelledOrders())
                .pendingOrders(kpi.getPendingOrders())
                .totalRevenue(safe(kpi.getTotalRevenue()))
                .averageOrderValue(safe(kpi.getAverageOrderValue()))
                .conversionRate(conversionRate)
                .byStatus(statusDtos)
                .build();
    }

    // ════════════════════════════════════════════════════════
    // CUSTOMER ANALYTICS
    // ════════════════════════════════════════════════════════

    /**
     * Top customers by total spending.
     * Calculates basic CLV = totalSpent / months_active.
     */
    @Cacheable(value = "report_top_customers", key = "#from + '_' + #to + '_' + #topN")
    public List<TopCustomerDTO> getTopCustomers(LocalDate from, LocalDate to, int topN) {
        LocalDateTime fromDt = from.atStartOfDay();
        LocalDateTime toDt   = to.atTime(23, 59, 59);

        return reportRepository.findTopCustomers(fromDt, toDt, topN)
                .stream()
                .map(p -> {
                    // Calculate CLV
                    long daysActive = p.getFirstOrderDate() != null && p.getLastOrderDate() != null
                            ? Duration.between(
                            p.getFirstOrderDate().atStartOfDay(),
                            p.getLastOrderDate().atStartOfDay()).toDays() + 1
                            : 1;
                    double monthsActive = Math.max(1.0, daysActive / 30.0);
                    BigDecimal clv = safe(p.getTotalSpent())
                            .divide(BigDecimal.valueOf(monthsActive), 2, RoundingMode.HALF_UP);

                    return TopCustomerDTO.builder()
                            .userId(p.getUserId())
                            .fullName(p.getFullName())
                            .email(p.getEmail())
                            .totalOrders(p.getTotalOrders())
                            .totalSpent(p.getTotalSpent())
                            .firstOrderDate(p.getFirstOrderDate())
                            .lastOrderDate(p.getLastOrderDate())
                            .customerLifetimeMonths(Math.round(monthsActive * 100.0) / 100.0)
                            .estimatedClv(clv)
                            .build();
                })
                .collect(Collectors.toList());
    }

    /**
     * New vs returning customer overview.
     * Calculates retention rate.
     */
    public CustomerOverviewDTO getCustomerOverview(LocalDate from, LocalDate to) {
        LocalDateTime fromDt = from.atStartOfDay();
        LocalDateTime toDt   = to.atTime(23, 59, 59);

        CustomerOverviewProjection proj = reportRepository.findCustomerOverview(fromDt, toDt);

        long total     = proj.getTotalActiveCustomers() == null ? 0 : proj.getTotalActiveCustomers();
        long returning = proj.getReturningCustomers()   == null ? 0 : proj.getReturningCustomers();

        double retentionRate = total == 0 ? 0.0
                : Math.round((returning * 100.0 / total) * 100.0) / 100.0;

        return CustomerOverviewDTO.builder()
                .totalCustomers(total)
                .newCustomers(proj.getNewCustomers())
                .returningCustomers(returning)
                .retentionRate(retentionRate)
                .build();
    }

    // ════════════════════════════════════════════════════════
    // PRODUCT ANALYTICS
    // ════════════════════════════════════════════════════════

    /**
     * Best-selling products (by quantity sold).
     */
    @Cacheable(value = "report_best_sellers", key = "#from + '_' + #to + '_' + #topN")
    public List<BestSellerDTO> getBestSellers(LocalDate from, LocalDate to, int topN) {
        LocalDateTime fromDt = from.atStartOfDay();
        LocalDateTime toDt   = to.atTime(23, 59, 59);

        return reportRepository.findBestSellers(fromDt, toDt, topN)
                .stream()
                .map(this::mapBestSeller)
                .collect(Collectors.toList());
    }

    // ════════════════════════════════════════════════════════
    // PRIVATE HELPERS
    // ════════════════════════════════════════════════════════

    private RevenueReportDTO mapRevenuePeriod(RevenuePeriodProjection p) {
        return RevenueReportDTO.builder()
                .period(p.getPeriod())
                .revenue(safe(p.getRevenue()))
                .orderCount(p.getOrderCount())
                .averageOrderValue(safe(p.getAverageOrderValue()))
                .grossProfit(safe(p.getGrossProfit()))
                .build();
    }

    private BestSellerDTO mapBestSeller(BestSellerProjection p) {
        return BestSellerDTO.builder()
                .productId(p.getProductId())
                .productName(p.getProductName())
                .thumbnail(p.getThumbnail())
                .quantitySold(p.getQuantitySold())
                .revenue(p.getRevenue())
                .currentStock(p.getCurrentStock())
                .rank(p.getRankNum())
                .build();
    }

    /**
     * Growth rate = (current - previous) / previous * 100
     * Returns null if previous is 0 (avoid divide-by-zero).
     */
    private Double calcGrowthRate(BigDecimal previous, BigDecimal current) {
        if (previous == null || previous.compareTo(BigDecimal.ZERO) == 0) return null;
        return current.subtract(previous)
                .divide(previous, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP)
                .doubleValue();
    }

    /** Null-safe BigDecimal. */
    private BigDecimal safe(BigDecimal val) {
        return val == null ? BigDecimal.ZERO : val;
    }

    private Long safe(Long val) {
        return val == null ? 0L : val;
    }

    /** Validate date range to prevent runaway queries. */
    private void validateDateRange(LocalDate from, LocalDate to, int maxDays) {
        if (from == null || to == null) throw new IllegalArgumentException("Date range required");
        if (from.isAfter(to)) throw new IllegalArgumentException("from must be before to");
        if (java.time.temporal.ChronoUnit.DAYS.between(from, to) > maxDays) {
            throw new IllegalArgumentException("Date range cannot exceed " + maxDays + " days");
        }
    }
}