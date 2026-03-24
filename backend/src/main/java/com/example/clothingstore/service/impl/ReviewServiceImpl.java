package com.example.clothingstore.service.impl;

import com.example.clothingstore.entity.Enum.OrderStatus;
import com.example.clothingstore.entity.Enum.ReviewStatus;
import com.example.clothingstore.entity.Review;
import com.example.clothingstore.exception.AppException;
import com.example.clothingstore.exception.ErrorCode;
import com.example.clothingstore.repository.OrderRepository;
import com.example.clothingstore.repository.ReviewRepository;
import com.example.clothingstore.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;

    @Override
    public Review createReview(Long productId, Integer rating, String comment, String userId) {
        validateInput(productId, rating, comment, userId);

        if (reviewRepository.existsByProductIdAndUserId(productId, userId)) {
            throw new AppException(ErrorCode.REVIEW_ALREADY_EXISTS);
        }

        boolean verifiedBuyer = isVerifiedBuyer(productId, userId);
        if (!verifiedBuyer) {
            throw new AppException(ErrorCode.REVIEW_NOT_VERIFIED_BUYER);
        }

        Review review = Review.builder()
                .productId(productId)
                .userId(userId)
                .rating(rating)
                .comment(comment)
                .verifiedPurchase(true)
                .status(ReviewStatus.PENDING)
                .build();

        return reviewRepository.save(review);
    }

    @Override
    public Review updateOwnReview(Long reviewId, Integer rating, String comment, String userId) {
        if (reviewId == null) {
            throw new AppException(ErrorCode.INVALID_DATA);
        }

        if (userId == null || userId.isBlank()) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        if (rating == null || rating < 1 || rating > 5) {
            throw new AppException(ErrorCode.INVALID_DATA);
        }

        if (comment == null || comment.isBlank()) {
            throw new AppException(ErrorCode.INVALID_DATA);
        }

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_FOUND));

        if (!Objects.equals(review.getUserId(), userId)) {
            throw new AppException(ErrorCode.REVIEW_EDIT_FORBIDDEN);
        }

        review.setRating(rating);
        review.setComment(comment.trim());
        review.setStatus(ReviewStatus.PENDING);

        return reviewRepository.save(review);
    }

    @Override
    public Page<Review> getApprovedReviewsByProduct(Long productId, Pageable pageable) {
        return reviewRepository.findByProductIdAndStatusOrderByCreatedAtDesc(productId, ReviewStatus.APPROVED, pageable);
    }

    @Override
    public Page<Review> getPendingReviews(Pageable pageable) {
        return reviewRepository.findByStatusOrderByCreatedAtAsc(ReviewStatus.PENDING, pageable);
    }

    @Override
    public List<Review> getReviewsOfUserByProducts(String userId, List<Long> productIds) {
        if (userId == null || userId.isBlank()) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        if (productIds == null || productIds.isEmpty()) {
            return List.of();
        }

        return reviewRepository.findByUserIdAndProductIdIn(userId, productIds);
    }

    @Override
    public boolean hasUserReviewedProduct(Long productId, String userId) {
        return reviewRepository.existsByProductIdAndUserId(productId, userId);
    }

    @Override
    public Review approveReview(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_FOUND));

        review.setStatus(ReviewStatus.APPROVED);
        return reviewRepository.save(review);
    }

    @Override
    public Review rejectReview(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_FOUND));

        review.setStatus(ReviewStatus.REJECTED);
        return reviewRepository.save(review);
    }

    private boolean isVerifiedBuyer(Long productId, String userId) {
        long completedOrders = orderRepository.countCompletedOrdersContainingProduct(userId, productId, OrderStatus.COMPLETED);
        return completedOrders > 0;
    }

    private void validateInput(Long productId, Integer rating, String comment, String userId) {
        if (productId == null) {
            throw new AppException(ErrorCode.INVALID_DATA);
        }

        if (userId == null || userId.isBlank()) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        if (rating == null || rating < 1 || rating > 5) {
            throw new AppException(ErrorCode.INVALID_DATA);
        }

        if (comment == null || comment.isBlank()) {
            throw new AppException(ErrorCode.INVALID_DATA);
        }
    }
}
