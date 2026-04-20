package com.example.clothingstore.repository;

import com.example.clothingstore.dtos.report.*;
import com.example.clothingstore.repository.report.projections.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.clothingstore.entity.Order;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * All analytics queries are NATIVE SQL for performance reasons:
 * - GROUP BY with aggregations are cleaner in SQL
 * - JPQL can't use DATE_FORMAT, YEAR(), MONTH() functions easily
 * - Use projections (interface-based) to avoid entity loading overhead
 */
@Repository
public interface ReportRepository extends JpaRepository<Order, Long> {

    // ════════════════════════════════════════════════════════
    // REVENUE REPORTS
    // ════════════════════════════════════════════════════════

    /**
     * Revenue by DAY in a date range.
     * WHY: Line chart daily trend - admin spots anomalies quickly.
     *
     * Uses DATE(created_at) to group by calendar day.
     * Filters only COMPLETED orders to reflect actual revenue.
     */
    @Query(value = """
        SELECT
            DATE_FORMAT(o.created_at, '%Y-%m-%d')   AS period,
            COALESCE(SUM(o.total_amount), 0)         AS revenue,
            COUNT(o.id)                              AS orderCount,
            COALESCE(AVG(o.total_amount), 0)         AS averageOrderValue,
            COALESCE(SUM(o.total_amount - o.shipping_fee
                - COALESCE(o.discount_amount, 0)
                - COALESCE((
                    SELECT SUM(oi2.quantity * s2.import_price)
                    FROM order_items oi2
                    JOIN skus s2 ON s2.id = oi2.sku_id
                    WHERE oi2.order_id = o.id
                ), 0)), 0)                           AS grossProfit
        FROM orders o
        WHERE o.status = 'COMPLETED'
          AND o.created_at BETWEEN :from AND :to
        GROUP BY DATE_FORMAT(o.created_at, '%Y-%m-%d')
        ORDER BY period ASC
        """, nativeQuery = true)
    List<RevenuePeriodProjection> findDailyRevenue(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    /**
     * Revenue by MONTH.
     * WHY: Monthly bars show seasonality patterns (e.g., Tet holiday spikes).
     */
    @Query(value = """
        SELECT
            DATE_FORMAT(o.created_at, '%Y-%m')       AS period,
            COALESCE(SUM(o.total_amount), 0)          AS revenue,
            COUNT(o.id)                               AS orderCount,
            COALESCE(AVG(o.total_amount), 0)          AS averageOrderValue,
            0                                         AS grossProfit
        FROM orders o
        WHERE o.status = 'COMPLETED'
          AND YEAR(o.created_at) = :year
        GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')
        ORDER BY period ASC
        """, nativeQuery = true)
    List<RevenuePeriodProjection> findMonthlyRevenue(@Param("year") int year);

    /**
     * Revenue by YEAR — last N years.
     * WHY: Year-over-year comparison shows business growth trend.
     */
    @Query(value = """
        SELECT
            CAST(YEAR(o.created_at) AS CHAR) AS period,
            COALESCE(SUM(o.total_amount), 0) AS revenue,
            COUNT(o.id)                      AS orderCount,
            COALESCE(AVG(o.total_amount), 0) AS averageOrderValue,
            0                                AS grossProfit
        FROM orders o
        WHERE o.status = 'COMPLETED'
          AND YEAR(o.created_at) >= :fromYear
        GROUP BY YEAR(o.created_at)
        ORDER BY period ASC
        """, nativeQuery = true)
    List<RevenuePeriodProjection> findYearlyRevenue(@Param("fromYear") int fromYear);

    // ════════════════════════════════════════════════════════
    // REVENUE BY PRODUCT
    // WHY: Rank products by revenue → decide which to stock up,
    //      which to discount/discontinue.
    // ════════════════════════════════════════════════════════

    @Query(value = """
        SELECT
            p.id                                       AS productId,
            p.name                                     AS productName,
            c.name                                     AS categoryName,
            b.name                                     AS brandName,
            SUM(oi.quantity)                           AS quantitySold,
            SUM(oi.quantity * oi.price_at_purchase)    AS revenue
        FROM order_items  oi
        JOIN orders       o  ON o.id  = oi.order_id
        JOIN skus         s  ON s.id  = oi.sku_id
        JOIN products     p  ON p.id  = s.product_id
        LEFT JOIN categories c ON c.id = p.category_id
        LEFT JOIN brands     b ON b.id = p.brand_id
        WHERE o.status    = 'COMPLETED'
          AND o.created_at BETWEEN :from AND :to
        GROUP BY p.id, p.name, c.name, b.name
        ORDER BY revenue DESC
        LIMIT :topN
        """, nativeQuery = true)
    List<ProductRevenueProjection> findRevenueByProduct(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("topN") int topN);

    // ════════════════════════════════════════════════════════
    // REVENUE BY CATEGORY
    // WHY: Portfolio analysis — which category drives the most revenue.
    //      Guides merchandising and marketing budget allocation.
    // ════════════════════════════════════════════════════════

    @Query(value = """
        SELECT
            c.id                                        AS categoryId,
            c.name                                      AS categoryName,
            COUNT(DISTINCT o.id)                        AS orderCount,
            SUM(oi.quantity)                            AS quantitySold,
            SUM(oi.quantity * oi.price_at_purchase)     AS revenue
        FROM order_items  oi
        JOIN orders       o  ON o.id  = oi.order_id
        JOIN skus         s  ON s.id  = oi.sku_id
        JOIN products     p  ON p.id  = s.product_id
        JOIN categories   c  ON c.id  = p.category_id
        WHERE o.status     = 'COMPLETED'
          AND o.created_at BETWEEN :from AND :to
        GROUP BY c.id, c.name
        ORDER BY revenue DESC
        """, nativeQuery = true)
    List<CategoryRevenueProjection> findRevenueByCategory(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    // ════════════════════════════════════════════════════════
    // ORDER REPORTS
    // ════════════════════════════════════════════════════════

    /**
     * Count orders grouped by status.
     * WHY: High cancellation rate → investigate UX issues, stock accuracy.
     *      High pending rate → operations bottleneck.
     */
    @Query(value = """
        SELECT
            o.status                          AS status,
            COUNT(o.id)                       AS orderCount,
            COALESCE(SUM(o.total_amount), 0)  AS totalAmount
        FROM orders o
        WHERE o.created_at BETWEEN :from AND :to
        GROUP BY o.status
        """, nativeQuery = true)
    List<OrderStatusProjection> findOrderCountByStatus(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    /**
     * Total orders and revenue for quick KPIs.
     */
    @Query(value = """
        SELECT
            COUNT(*)                                                      AS totalOrders,
            SUM(CASE WHEN status = 'COMPLETED'          THEN 1 ELSE 0 END) AS completedOrders,
            SUM(CASE WHEN status = 'CANCELLED'          THEN 1 ELSE 0 END) AS cancelledOrders,
            SUM(CASE WHEN status = 'PENDING'            THEN 1 ELSE 0 END) AS pendingOrders,
            SUM(CASE WHEN status = 'COMPLETED'          THEN total_amount ELSE 0 END) AS totalRevenue,
            AVG(CASE WHEN status = 'COMPLETED'          THEN total_amount END) AS averageOrderValue
        FROM orders
        WHERE created_at BETWEEN :from AND :to
        """, nativeQuery = true)
    OrderKpiProjection findOrderKpis(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    // ════════════════════════════════════════════════════════
    // CUSTOMER ANALYTICS
    // ════════════════════════════════════════════════════════

    /**
     * Top customers ranked by total spending.
     * WHY: Identify VIP customers → send exclusive coupons, loyalty perks.
     *      High CLV customers should receive priority service.
     */
    @Query(value = """
        SELECT
            u.id                                    AS userId,
            u.full_name                             AS fullName,
            u.email                                 AS email,
            COUNT(o.id)                             AS totalOrders,
            SUM(o.total_amount)                     AS totalSpent,
            MIN(DATE(o.created_at))                 AS firstOrderDate,
            MAX(DATE(o.created_at))                 AS lastOrderDate
        FROM orders o
        JOIN users u ON u.id = o.user_id
        WHERE o.status = 'COMPLETED'
          AND o.created_at BETWEEN :from AND :to
        GROUP BY u.id, u.full_name, u.email
        ORDER BY totalSpent DESC
        LIMIT :topN
        """, nativeQuery = true)
    List<TopCustomerProjection> findTopCustomers(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("topN") int topN);

    /**
     * New customers (first order in date range) vs returning.
     * WHY: Retention rate is a core health metric.
     *      Low retention → focus on loyalty programs.
     */
    @Query(value = """
        SELECT
            COUNT(DISTINCT o.user_id)    AS totalActiveCustomers,
            SUM(CASE
                WHEN first_order.first_order_date BETWEEN :from AND :to
                THEN 1 ELSE 0
            END)                         AS newCustomers,
            SUM(CASE
                WHEN first_order.first_order_date < :from
                THEN 1 ELSE 0
            END)                         AS returningCustomers
        FROM orders o
        JOIN (
            SELECT user_id, MIN(created_at) AS first_order_date
            FROM orders
            WHERE status = 'COMPLETED'
            GROUP BY user_id
        ) first_order ON first_order.user_id = o.user_id
        WHERE o.status = 'COMPLETED'
          AND o.created_at BETWEEN :from AND :to
        """, nativeQuery = true)
    CustomerOverviewProjection findCustomerOverview(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    // ════════════════════════════════════════════════════════
    // PRODUCT ANALYTICS
    // ════════════════════════════════════════════════════════

    /**
     * Best-selling products by quantity.
     * WHY: Flash Sale candidates, restock priority, featured placement.
     */
    @Query(value = """
        SELECT
            p.id                                    AS productId,
            p.name                                  AS productName,
            p.thumbnail                             AS thumbnail,
            SUM(oi.quantity)                        AS quantitySold,
            SUM(oi.quantity * oi.price_at_purchase) AS revenue,
            COALESCE(SUM(inv.available_quantity), 0) AS currentStock,
            RANK() OVER (ORDER BY SUM(oi.quantity) DESC) AS rankNum
        FROM order_items  oi
        JOIN orders       o   ON o.id  = oi.order_id
        JOIN skus         s   ON s.id  = oi.sku_id
        JOIN products     p   ON p.id  = s.product_id
        LEFT JOIN inventory inv ON inv.sku_id = s.id
        WHERE o.status = 'COMPLETED'
          AND o.created_at BETWEEN :from AND :to
        GROUP BY p.id, p.name, p.thumbnail
        ORDER BY quantitySold DESC
        LIMIT :topN
        """, nativeQuery = true)
    List<BestSellerProjection> findBestSellers(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("topN") int topN);

    /**
     * Revenue by WEEK.
     */
    @Query(value = """
        SELECT
            DATE_FORMAT(o.created_at, '%X-W%V')      AS period,
            COALESCE(SUM(o.total_amount), 0)         AS revenue,
            COUNT(o.id)                              AS orderCount,
            COALESCE(AVG(o.total_amount), 0)         AS averageOrderValue,
            0                                        AS grossProfit
        FROM orders o
        WHERE o.status = 'COMPLETED'
          AND o.created_at BETWEEN :from AND :to
        GROUP BY DATE_FORMAT(o.created_at, '%X-W%V')
        ORDER BY period ASC
        """, nativeQuery = true)
    List<RevenuePeriodProjection> findWeeklyRevenue(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);


    /**
     * Dashboard KPIs — today vs yesterday vs this month vs last month.
     * Used for % change cards (↑12% vs last month).
     */
    @Query(value = """
        SELECT COALESCE(SUM(total_amount), 0)
        FROM orders
        WHERE status = 'COMPLETED'
          AND created_at BETWEEN :from AND :to
        """, nativeQuery = true)
    BigDecimal findTotalRevenueBetween(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    @Query(value = """
        SELECT COUNT(*)
        FROM orders
        WHERE created_at BETWEEN :from AND :to
        """, nativeQuery = true)
    Long findOrderCountBetween(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    @Query(value = """
        SELECT COUNT(DISTINCT user_id)
        FROM orders
        WHERE status = 'COMPLETED'
          AND created_at BETWEEN :from AND :to
          AND user_id IN (
              SELECT user_id FROM orders
              GROUP BY user_id
              HAVING MIN(created_at) BETWEEN :from AND :to
          )
        """, nativeQuery = true)
    Long findNewCustomerCount(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    /**
     * Product Performance (Top or Bottom).
     * WHY: Identifies which products to push (Top) or discontinue (Bottom).
     * Uses IFNULL trick to ignore filters if they are null.
     */
    @Query(value = """
        SELECT
            p.id                                    AS productId,
            p.name                                  AS productName,
            p.thumbnail                             AS thumbnail,
            SUM(oi.quantity)                        AS quantitySold,
            SUM(oi.quantity * oi.price_at_purchase) AS revenue,
            COALESCE(MAX(inv.available_quantity), 0) AS currentStock,
            RANK() OVER (ORDER BY SUM(oi.quantity) DESC) AS rankNum
        FROM order_items  oi
        JOIN orders       o   ON o.id  = oi.order_id
        JOIN skus         s   ON s.id  = oi.sku_id
        JOIN products     p   ON p.id  = s.product_id
        LEFT JOIN inventory inv ON inv.sku_id = s.id
        WHERE o.status = 'COMPLETED'
          AND o.created_at BETWEEN :from AND :to
          AND (:categoryId IS NULL OR p.category_id = :categoryId)
          AND (:brandId IS NULL OR p.brand_id = :brandId)
        GROUP BY p.id, p.name, p.thumbnail
        ORDER BY 
            CASE WHEN :sortOrder = 'ASC' THEN SUM(oi.quantity) END ASC,
            CASE WHEN :sortOrder = 'DESC' THEN SUM(oi.quantity) END DESC
        LIMIT :topN
        """, nativeQuery = true)
    List<BestSellerProjection> findProductPerformance(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("categoryId") Long categoryId,
            @Param("brandId") Long brandId,
            @Param("sortOrder") String sortOrder,
            @Param("topN") int topN);
}