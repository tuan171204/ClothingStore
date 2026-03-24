package com.example.clothingstore.repository;

import com.example.clothingstore.entity.Enum.ReviewStatus;
import com.example.clothingstore.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

	Page<Review> findByProductIdAndStatusOrderByCreatedAtDesc(Long productId, ReviewStatus status, Pageable pageable);

	Page<Review> findByStatusOrderByCreatedAtAsc(ReviewStatus status, Pageable pageable);

	boolean existsByProductIdAndUserId(Long productId, String userId);

	List<Review> findByUserIdAndProductIdIn(String userId, List<Long> productIds);

}
