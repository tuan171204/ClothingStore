package com.example.clothingstore.service;

import com.example.clothingstore.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ReviewService {

    Review createReview(Long productId, Integer rating, String comment, String userId);

    Review updateOwnReview(Long reviewId, Integer rating, String comment, String userId);

    Page<Review> getApprovedReviewsByProduct(Long productId, Pageable pageable);

    Page<Review> getPendingReviews(Pageable pageable);

    List<Review> getReviewsOfUserByProducts(String userId, List<Long> productIds);

    boolean hasUserReviewedProduct(Long productId, String userId);

    Review approveReview(Long reviewId);

    Review rejectReview(Long reviewId);
}
