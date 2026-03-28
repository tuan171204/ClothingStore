package com.example.clothingstore.repository;

import com.example.clothingstore.entity.Enum.OrderStatus;
import com.example.clothingstore.entity.Enum.ReviewStatus;
import com.example.clothingstore.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {

	/** Lấy review đã APPROVED của 1 sản phẩm */
	Page<Review> findByProductIdAndStatusOrderByCreatedAtDesc(
			Long productId,
			ReviewStatus status,
			Pageable pageable
	);

	/** Admin: Lấy review đang chờ duyệt */
	Page<Review> findByStatusOrderByCreatedAtAsc(ReviewStatus status, Pageable pageable);

	/** Check User đã review sản phẩm trong đơn hàng CỤ THỂ chưa */
	boolean existsByUserIdAndProductIdAndOrderId(String userId, Long productId, Long orderId);

	/** Lấy review của User cho 1 đơn hàng + sản phẩm cụ thể */
	Optional<Review> findByUserIdAndProductIdAndOrderId(String userId, Long productId, Long orderId);

	/** Lấy tất cả review của User theo danh sách productId (cho trang Order History) */
	List<Review> findByUserIdAndProductIdIn(String userId, List<Long> productIds);

	/** Lấy tất cả review của 1 orderId */
	List<Review> findByOrderId(Long orderId);

	/** Đếm completed orders chứa product (giữ nguyên từ cũ) */
	@Query("""
        SELECT COUNT(DISTINCT o.id) FROM Order o
        JOIN o.orderItems oi
        JOIN Sku s ON s.id = oi.skuId
        WHERE o.userId = :userId
          AND s.product.id = :productId
          AND o.status = :status
        """)
	long countCompletedOrdersContainingProduct(
			@Param("userId") String userId,
			@Param("productId") Long productId,
			@Param("status") OrderStatus status
	);

	@Query("""
        SELECT r FROM Review r
        LEFT JOIN FETCH r.sku s
        LEFT JOIN FETCH s.product p
        WHERE r.status = :status
          AND (:minRating IS NULL OR r.rating >= :minRating)
          AND (:maxRating IS NULL OR r.rating <= :maxRating)
          AND (:productName IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%',:productName,'%')))
          AND (:fromDate IS NULL OR r.createdAt >= :fromDate)
        ORDER BY r.createdAt DESC
        """)
	Page<Review> findPendingWithFilter(
			@Param("status") ReviewStatus status,
			@Param("minRating") Integer minRating,
			@Param("maxRating") Integer maxRating,
			@Param("productName") String productName,
			@Param("fromDate") java.time.LocalDateTime fromDate,
			Pageable pageable
	);
}