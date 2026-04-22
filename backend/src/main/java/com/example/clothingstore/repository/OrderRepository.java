package com.example.clothingstore.repository;

import com.example.clothingstore.entity.Enum.OrderStatus;
import com.example.clothingstore.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByUserId(String userId);

    List<Order> findAllByOrderByCreatedAtDesc();

    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.orderItems WHERE o.id = :id")
    Optional<Order> findByIdWithItems(@Param("id") Long id);

    // Phân trang có spec
    Page<Order> findAll(Specification<Order> spec, Pageable pageable);

    Optional<Order> findByTrackingCode(String code);

    @Query("""
                    SELECT COUNT(o)
                    FROM Order o
                    JOIN o.orderItems oi
                    JOIN Sku s ON s.id = oi.skuId
                    WHERE o.userId = :userId
                        AND o.status = :status
                        AND s.product.id = :productId
                    """)
    long countCompletedOrdersContainingProduct(@Param("userId") String userId,
                                             @Param("productId") Long productId,
                                             @Param("status") OrderStatus status);

    @Query("""
        SELECT DISTINCT o FROM Order o
        LEFT JOIN FETCH o.orderItems
        WHERE o.status = :status
          AND o.paymentMethod = :paymentMethod
          AND o.createdAt <= :thresholdTime
    """)
    List<Order> findAbandonedOrders(@Param("status") OrderStatus status,
                                    @Param("paymentMethod") String paymentMethod,
                                    @Param("thresholdTime") LocalDateTime thresholdTime);
}
