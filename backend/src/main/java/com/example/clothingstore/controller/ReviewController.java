package com.example.clothingstore.controller;

import com.example.clothingstore.dto.request.ReviewFromOrderRequest;
import com.example.clothingstore.dto.response.ApiResponse;
import com.example.clothingstore.dto.response.OrderItemReviewStatus;
import com.example.clothingstore.dto.response.ReviewDetailResponse;
import com.example.clothingstore.dto.response.ReviewResponse;
import com.example.clothingstore.service.impl.ReviewServiceImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("${api.prefix}")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewServiceImpl reviewService;

    // ================================================================
    // PUBLIC - Trang Chi tiết sản phẩm
    // ================================================================

    /**
     * GET /products/{productId}/reviews
     * Chỉ trả về Reviews đã APPROVED — không cần đăng nhập
     */
    @GetMapping("/products/{productId}/reviews")
    public ApiResponse<Page<ReviewResponse>> getApprovedReviews(
            @PathVariable Long productId,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        return ApiResponse.<Page<ReviewResponse>>builder()
                .result(reviewService.getApprovedReviewsByProduct(productId, pageable))
                .build();
    }

    // ================================================================
    // CUSTOMER - Trang Lịch sử đơn hàng
    // ================================================================

    /**
     * GET /orders/{orderId}/review-status
     * Trả về trạng thái review của từng item trong đơn (đã/chưa review)
     * Yêu cầu login và phải là chủ đơn hàng
     */
    @GetMapping("/orders/{orderId}/review-status")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<OrderItemReviewStatus>> getReviewStatus(@PathVariable Long orderId) {
        return ApiResponse.<List<OrderItemReviewStatus>>builder()
                .result(reviewService.getReviewStatusByOrder(orderId))
                .build();
    }

    /**
     * POST /reviews
     * Tạo hoặc cập nhật review từ trang lịch sử đơn hàng.
     * Backend tự validate: đơn COMPLETED, SKU nằm trong đơn, chưa review.
     */
    @PostMapping("/reviews")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ReviewResponse> createOrUpdateReview(
            @Valid @RequestBody ReviewFromOrderRequest request
    ) {
        return ApiResponse.<ReviewResponse>builder()
                .result(reviewService.createOrUpdateReviewFromOrder(request))
                .build();
    }

    // ================================================================
    // ADMIN
    // ================================================================

    @PutMapping("/admin/reviews/{reviewId}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<ReviewResponse> approveReview(@PathVariable Long reviewId) {
        return ApiResponse.<ReviewResponse>builder()
                .result(reviewService.approveReview(reviewId))
                .build();
    }

    @PutMapping("/admin/reviews/{reviewId}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<ReviewResponse> rejectReview(@PathVariable Long reviewId) {
        return ApiResponse.<ReviewResponse>builder()
                .result(reviewService.rejectReview(reviewId))
                .build();
    }

    @PostMapping("/admin/reviews/bulk-approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<List<Long>> bulkApprove(@RequestBody List<Long> reviewIds) {
        return ApiResponse.<List<Long>>builder()
                .result(reviewService.bulkApprove(reviewIds))
                .build();
    }

    @PostMapping("/admin/reviews/bulk-reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<List<Long>> bulkReject(@RequestBody List<Long> reviewIds) {
        return ApiResponse.<List<Long>>builder()
                .result(reviewService.bulkReject(reviewIds))
                .build();
    }

    @GetMapping("/admin/reviews/pending")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<Page<ReviewDetailResponse>> getPendingReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Integer minRating,
            @RequestParam(required = false) Integer maxRating,
            @RequestParam(required = false) String productName,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime fromDate
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ApiResponse.<Page<ReviewDetailResponse>>builder()
                .result(reviewService.getPendingWithFilter(
                        minRating, maxRating, productName, fromDate, pageable))
                .build();
    }
}