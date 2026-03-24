package com.example.clothingstore.controller;

import com.example.clothingstore.dto.request.ReviewRequest;
import com.example.clothingstore.dto.response.ApiResponse;
import com.example.clothingstore.dto.response.ReviewResponse;
import com.example.clothingstore.entity.Review;
import com.example.clothingstore.exception.AppException;
import com.example.clothingstore.exception.ErrorCode;
import com.example.clothingstore.repository.UserRepository;
import com.example.clothingstore.service.ReviewService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("${api.prefix}")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ReviewController {

    ReviewService reviewService;
    UserRepository userRepository;

    @GetMapping("/products/{productId}/reviews")
    public ApiResponse<Page<ReviewResponse>> getApprovedReviewsByProduct(@PathVariable Long productId,
                                                                          @PageableDefault(size = 10) Pageable pageable) {
        Page<ReviewResponse> response = reviewService.getApprovedReviewsByProduct(productId, pageable)
                .map(this::toResponse);

        return ApiResponse.<Page<ReviewResponse>>builder()
                .result(response)
                .build();
    }

    @PostMapping("/products/{productId}/reviews")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ReviewResponse> createReview(@PathVariable Long productId,
                                                    @RequestBody ReviewRequest request) {
        String userId = getCurrentUserId();

        Review review = reviewService.createReview(productId, request.getRating(), request.getComment(), userId);

        return ApiResponse.<ReviewResponse>builder()
                .result(toResponse(review))
                .build();
    }

    @PutMapping("/reviews/{reviewId}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ReviewResponse> updateOwnReview(@PathVariable Long reviewId,
                                                        @RequestBody ReviewRequest request) {
        String userId = getCurrentUserId();

        Review review = reviewService.updateOwnReview(reviewId, request.getRating(), request.getComment(), userId);

        return ApiResponse.<ReviewResponse>builder()
                .result(toResponse(review))
                .build();
    }

    @GetMapping("/admin/reviews/pending")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<Page<ReviewResponse>> getPendingReviews(@PageableDefault(size = 20) Pageable pageable) {
        Page<ReviewResponse> response = reviewService.getPendingReviews(pageable)
                .map(this::toResponse);

        return ApiResponse.<Page<ReviewResponse>>builder()
                .result(response)
                .build();
    }

    @GetMapping("/reviews/me")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<ReviewResponse>> getMyReviewsByProducts(@RequestParam(name = "productIds", required = false) List<Long> productIds) {
        String userId = getCurrentUserId();

        List<ReviewResponse> response = reviewService.getReviewsOfUserByProducts(userId, productIds)
                .stream()
                .map(this::toResponse)
                .toList();

        return ApiResponse.<List<ReviewResponse>>builder()
                .result(response)
                .build();
    }

    @PutMapping("/admin/reviews/{reviewId}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<ReviewResponse> approveReview(@PathVariable Long reviewId) {
        Review review = reviewService.approveReview(reviewId);
        return ApiResponse.<ReviewResponse>builder()
                .result(toResponse(review))
                .build();
    }

    @PutMapping("/admin/reviews/{reviewId}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<ReviewResponse> rejectReview(@PathVariable Long reviewId) {
        Review review = reviewService.rejectReview(reviewId);
        return ApiResponse.<ReviewResponse>builder()
                .result(toResponse(review))
                .build();
    }

    private String getCurrentUserId() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();

        if (username == null || username.isBlank() || "anonymousUser".equals(username)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        return userRepository.findByUsername(username)
                .map(user -> user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private ReviewResponse toResponse(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .productId(review.getProductId())
                .userId(review.getUserId())
                .rating(review.getRating())
                .comment(review.getComment())
                .status(review.getStatus())
                .verifiedPurchase(review.isVerifiedPurchase())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
