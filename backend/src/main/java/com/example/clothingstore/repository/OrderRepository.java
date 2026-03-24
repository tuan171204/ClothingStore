package com.example.clothingstore.repository;

import com.example.clothingstore.entity.Enum.OrderStatus;
import com.example.clothingstore.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    // Lấy danh sách sắp xếp theo ngày tạo (Mới nhất lên đầu)
    List<Order> findAllByOrderByCreatedAtDesc();

    List<Order> findByUserId(String userId);

    // Lấy chi tiết đơn hàng + Load luôn OrderItems (Tránh lỗi Lazy Loading)
    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.orderItems WHERE o.id = :id")
    Optional<Order> findByIdWithItems(@Param("id") Long id);

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
}
