package com.example.clothingstore.service;

import com.example.clothingstore.dtos.review.response.ReviewDetailResponse;
import com.example.clothingstore.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

public interface ReviewService {

    Review createReview(Long productId,Long skuId ,Integer rating, String comment, String userId);

    Review updateOwnReview(Long reviewId, Integer rating, String comment, String userId);

    Page<Review> getApprovedReviewsByProduct(Long productId, Pageable pageable);

    Page<Review> getPendingReviews(Pageable pageable);

    List<Review> getReviewsOfUserByProducts(String userId, List<Long> productIds);

    boolean hasUserReviewedProduct(Long productId, String userId);

    Review approveReview(Long reviewId);

    Review rejectReview(Long reviewId);

    Page<ReviewDetailResponse> getPendingWithFilter(Integer minRating, Integer maxRating,
                                                    String productName, LocalDateTime fromDate,
                                                    Pageable pageable);

    List<Long> bulkApprove(List<Long> reviewIds);

    List<Long> bulkReject(List<Long> reviewIds);
}
