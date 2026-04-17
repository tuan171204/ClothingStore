// ============================================================
// FILE: controller/ReportingController.java
// ============================================================
package com.example.clothingstore.controller;

import com.example.clothingstore.dtos.report.*;
import com.example.clothingstore.service.impl.ReportingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * All reporting APIs require STAFF+ role.
 * Revenue/customer analytics APIs require ADMIN+ for sensitive data.
 *
 * Base URL: /api/v1/reports
 */
@RestController
@RequestMapping("${api.prefix}/reports")
@RequiredArgsConstructor
@Tag(name = "Reports & Analytics", description = "Business intelligence APIs for admin dashboard")
@SecurityRequirement(name = "Bearer Authentication")
public class ReportingController {

    private final ReportingService reportingService;

    // ════════════════════════════════════════════════════════
    // DASHBOARD
    // ════════════════════════════════════════════════════════

    /**
     * GET /reports/dashboard
     * Single API call to populate all admin dashboard KPI cards.
     * Returns today + this month + YTD revenue, growth %, low-stock alerts, top 5 products.
     */
    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Dashboard overview KPIs",
            description = "Returns all dashboard cards: revenue today/month/year, growth %, " +
                    "low stock alerts, top 5 products, last 30 day trend chart")
    public ResponseEntity<DashboardSummaryDTO> getDashboard() {
        return ResponseEntity.ok(reportingService.getDashboardSummary());
    }

    // ════════════════════════════════════════════════════════
    // REVENUE REPORTS
    // ════════════════════════════════════════════════════════

    /**
     * GET /reports/revenue/daily?from=2026-01-01&to=2026-01-31
     * Max 90 days per request.
     */
    @GetMapping("/revenue/daily")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Daily revenue breakdown",
            description = "Revenue per day for a date range (max 90 days). " +
                    "Use for line charts. Includes gross profit estimation.")
    public ResponseEntity<List<RevenueReportDTO>> getDailyRevenue(
            @Parameter(description = "Start date (yyyy-MM-dd)", example = "2026-01-01")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @Parameter(description = "End date (yyyy-MM-dd)", example = "2026-01-31")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(reportingService.getDailyRevenue(from, to));
    }

    /**
     * GET /reports/revenue/monthly?year=2026
     */
    @GetMapping("/revenue/monthly")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Monthly revenue for a given year",
            description = "12 data points for bar chart. Shows seasonality.")
    public ResponseEntity<List<RevenueReportDTO>> getMonthlyRevenue(
            @Parameter(description = "Year (e.g. 2026)", example = "2026")
            @RequestParam(defaultValue = "#{T(java.time.Year).now().getValue()}") int year) {
        return ResponseEntity.ok(reportingService.getMonthlyRevenue(year));
    }

    /**
     * GET /reports/revenue/yearly?fromYear=2023
     */
    @GetMapping("/revenue/yearly")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Year-over-year revenue",
            description = "Revenue per year from a given year to now. Use for growth trend.")
    public ResponseEntity<List<RevenueReportDTO>> getYearlyRevenue(
            @RequestParam(defaultValue = "2023") int fromYear) {
        return ResponseEntity.ok(reportingService.getYearlyRevenue(fromYear));
    }

    /**
     * GET /reports/revenue/by-product?from=2026-01-01&to=2026-01-31&topN=10
     */
    @GetMapping("/revenue/by-product")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Top N products by revenue",
            description = "Ranked product list with revenue share %. " +
                    "Use to identify Flash Sale candidates and restock priorities.")
    public ResponseEntity<List<RevenueByProductDTO>> getRevenueByProduct(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "10") int topN) {
        return ResponseEntity.ok(reportingService.getRevenueByProduct(from, to, topN));
    }

    /**
     * GET /reports/revenue/by-category?from=2026-01-01&to=2026-03-31
     */
    @GetMapping("/revenue/by-category")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Revenue breakdown by product category",
            description = "Pie chart data for category portfolio analysis. " +
                    "Shows which categories drive the most revenue.")
    public ResponseEntity<List<RevenueByCategoryDTO>> getRevenueByCategory(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(reportingService.getRevenueByCategory(from, to));
    }

    // ════════════════════════════════════════════════════════
    // ORDER REPORTS
    // ════════════════════════════════════════════════════════

    /**
     * GET /reports/orders/summary?from=2026-01-01&to=2026-03-31
     */
    @GetMapping("/orders/summary")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Order summary and conversion funnel",
            description = "Total orders by status, conversion rate (completed/total), " +
                    "average order value. Use to identify operational bottlenecks.")
    public ResponseEntity<OrderSummaryDTO> getOrderSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(reportingService.getOrderSummary(from, to));
    }

    // ════════════════════════════════════════════════════════
    // CUSTOMER ANALYTICS
    // ════════════════════════════════════════════════════════

    /**
     * GET /reports/customers/overview?from=2026-01-01&to=2026-03-31
     */
    @GetMapping("/customers/overview")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Customer new vs returning overview",
            description = "Retention rate, new customer count vs returning. " +
                    "Low retention → invest in loyalty programs.")
    public ResponseEntity<CustomerOverviewDTO> getCustomerOverview(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(reportingService.getCustomerOverview(from, to));
    }

    /**
     * GET /reports/customers/top?from=2026-01-01&to=2026-12-31&topN=20
     */
    @GetMapping("/customers/top")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Top customers by total spending",
            description = "Ranked customer list with CLV estimate. " +
                    "Use to create VIP tiers and exclusive coupon campaigns.")
    public ResponseEntity<List<TopCustomerDTO>> getTopCustomers(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "20") int topN) {
        return ResponseEntity.ok(reportingService.getTopCustomers(from, to, topN));
    }

    // ════════════════════════════════════════════════════════
    // PRODUCT ANALYTICS
    // ════════════════════════════════════════════════════════

    /**
     * GET /reports/products/best-sellers?from=2026-01-01&to=2026-03-31&topN=10
     */
    @GetMapping("/products/best-sellers")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Best-selling products by quantity",
            description = "Top products ranked by units sold. Includes current stock. " +
                    "Low stock + high sales → urgent restock flag.")
    public ResponseEntity<List<BestSellerDTO>> getBestSellers(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "10") int topN) {
        return ResponseEntity.ok(reportingService.getBestSellers(from, to, topN));
    }
}