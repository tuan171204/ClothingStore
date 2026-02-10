package com.example.clothingstore.repository;

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

    // Lấy chi tiết đơn hàng + Load luôn OrderItems (Tránh lỗi Lazy Loading)
    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.orderItems WHERE o.id = :id")
    Optional<Order> findByIdWithItems(@Param("id") Long id);

    Optional<Order> findByTrackingCode(String code);
}
