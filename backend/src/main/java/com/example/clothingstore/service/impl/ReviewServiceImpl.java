package com.example.clothingstore.service.impl;

import com.example.clothingstore.dto.request.ReviewFromOrderRequest;
import com.example.clothingstore.dto.response.OrderItemReviewStatus;
import com.example.clothingstore.dto.response.ReviewDetailResponse;
import com.example.clothingstore.dto.response.ReviewResponse;
import com.example.clothingstore.entity.*;
import com.example.clothingstore.entity.Enum.OrderStatus;
import com.example.clothingstore.entity.Enum.ReviewStatus;
import com.example.clothingstore.exception.AppException;
import com.example.clothingstore.exception.ErrorCode;
import com.example.clothingstore.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl {

    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;
    private final SkuRepository skuRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    // ================================================================
    // PUBLIC API - CHO TRANG CHI TIẾT SẢN PHẨM
    // ================================================================

    /**
     * Lấy danh sách Review đã APPROVED của sản phẩm (Read-only, không cần login)
     */
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getApprovedReviewsByProduct(Long productId, Pageable pageable) {
        return reviewRepository
                .findByProductIdAndStatusOrderByCreatedAtDesc(productId, ReviewStatus.APPROVED, pageable)
                .map(this::toResponse);
    }

    // ================================================================
    // PUBLIC API - CHO TRANG LỊCH SỬ ĐƠN HÀNG
    // ================================================================

    /**
     * Trả về trạng thái review của từng item trong 1 đơn hàng COMPLETED.
     * Frontend dùng để biết item nào đã review / chưa review.
     */
    @Transactional(readOnly = true)
    public List<OrderItemReviewStatus> getReviewStatusByOrder(Long orderId) {
        String currentUserId = getCurrentUserId();

        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_DATA));

        // Chỉ cho xem status nếu là chủ đơn hàng
        if (!order.getUserId().equals(currentUserId)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        return order.getOrderItems().stream()
                .map(item -> buildReviewStatus(item, orderId, currentUserId))
                .collect(Collectors.toList());
    }

    /**
     * Tạo hoặc cập nhật Review từ trang Lịch sử đơn hàng.
     *
     * LOGIC XÁC THỰC:
     * 1. Đơn hàng phải tồn tại và thuộc về User đang đăng nhập.
     * 2. Đơn hàng phải có trạng thái COMPLETED.
     * 3. SKU + Product phải nằm trong đơn hàng đó.
     * 4. Nếu đã có review cho (userId + productId + orderId) -> cập nhật thay vì tạo mới.
     */
    @Transactional
    public ReviewResponse createOrUpdateReviewFromOrder(ReviewFromOrderRequest request) {
        String currentUserId = getCurrentUserId();

        // --- BƯỚC 1: Validate đơn hàng ---
        Order order = orderRepository.findByIdWithItems(request.getOrderId())
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_DATA));

        if (!order.getUserId().equals(currentUserId)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        if (order.getStatus() != OrderStatus.COMPLETED) {
            throw new RuntimeException("Chỉ có thể đánh giá đơn hàng đã hoàn thành");
        }

        // --- BƯỚC 2: Validate SKU nằm trong đơn hàng ---
        boolean skuInOrder = order.getOrderItems().stream()
                .anyMatch(item -> item.getSkuId().equals(request.getSkuId()));

        if (!skuInOrder) {
            throw new RuntimeException("Sản phẩm này không nằm trong đơn hàng được chỉ định");
        }

        // --- BƯỚC 3: Validate SKU -> Product mapping ---
        Sku sku = skuRepository.findById(request.getSkuId())
                .orElseThrow(() -> new AppException(ErrorCode.SKU_NOT_FOUND));

        if (!sku.getProduct().getId().equals(request.getProductId())) {
            throw new AppException(ErrorCode.INVALID_DATA);
        }

        // --- BƯỚC 4: Tạo mới hoặc cập nhật ---
        Optional<Review> existingOpt = reviewRepository
                .findByUserIdAndProductIdAndOrderId(currentUserId, request.getProductId(), request.getOrderId());

        Review review;
        if (existingOpt.isPresent()) {
            // Cập nhật review cũ
            review = existingOpt.get();
            review.setRating(request.getRating());
            review.setComment(request.getComment().trim());
            review.setStatus(ReviewStatus.PENDING); // Cần duyệt lại
        } else {
            // Tạo mới
            review = Review.builder()
                    .productId(request.getProductId())
                    .userId(currentUserId)
                    .orderId(request.getOrderId())
                    .sku(sku)
                    .rating(request.getRating())
                    .comment(request.getComment().trim())
                    .verifiedPurchase(true)  // Đã verify bằng orderId ở trên
                    .status(ReviewStatus.PENDING)
                    .build();
        }

        return toResponse(reviewRepository.save(review));
    }

    // ================================================================
    // ADMIN APIs
    // ================================================================

    @Transactional(readOnly = true)
    public Page<ReviewResponse> getPendingReviews(Pageable pageable) {
        return reviewRepository.findByStatusOrderByCreatedAtAsc(ReviewStatus.PENDING, pageable)
                .map(this::toResponse);
    }

    @Transactional
    public ReviewResponse approveReview(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_FOUND));
        review.setStatus(ReviewStatus.APPROVED);
        return toResponse(reviewRepository.save(review));
    }

    @Transactional
    public ReviewResponse rejectReview(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_FOUND));
        review.setStatus(ReviewStatus.REJECTED);
        return toResponse(reviewRepository.save(review));
    }

    // ================================================================
    // HELPER METHODS
    // ================================================================

    private OrderItemReviewStatus buildReviewStatus(OrderItem item, Long orderId, String userId) {
        Sku sku = skuRepository.findById(item.getSkuId()).orElse(null);
        String skuName = sku != null && sku.getValues() != null
                ? sku.getValues().stream()
                .map(v -> v.getOptionValue().getValue())
                .collect(Collectors.joining(" - "))
                : "";
        String thumbnail = sku != null ? sku.getImgUrl() : null;
        if (thumbnail == null && sku != null && sku.getProduct() != null) {
            thumbnail = sku.getProduct().getThumbnail();
        }
        Long productId = sku != null && sku.getProduct() != null ? sku.getProduct().getId() : null;

        Optional<Review> existingReview = productId != null
                ? reviewRepository.findByUserIdAndProductIdAndOrderId(userId, productId, orderId)
                : Optional.empty();

        return OrderItemReviewStatus.builder()
                .orderItemId(item.getId())
                .skuId(item.getSkuId())
                .productId(productId)
                .productName(item.getProductName())
                .skuName(skuName)
                .thumbnailUrl(thumbnail)
                .reviewed(existingReview.isPresent())
                .existingReviewId(existingReview.map(Review::getId).orElse(null))
                .existingRating(existingReview.map(Review::getRating).orElse(null))
                .existingComment(existingReview.map(Review::getComment).orElse(null))
                .reviewStatus(existingReview.map(r -> r.getStatus().name()).orElse(null))
                .build();
    }

    private String getCurrentUserId() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        if (username == null || "anonymousUser".equals(username)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        return userRepository.findByUsername(username)
                .map(User::getId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    public ReviewResponse toResponse(Review review) {
        String displayName = userRepository.findById(review.getUserId())
                .map(u -> u.getFullName() != null ? u.getFullName() : u.getUsername())
                .orElse("Người dùng ẩn danh");

        String skuName = "";
        if (review.getSku() != null && review.getSku().getValues() != null) {
            skuName = review.getSku().getValues().stream()
                    .map(v -> v.getOptionValue().getValue())
                    .collect(Collectors.joining(" - "));
        }

        String productName = productRepository.findById(review.getProductId())
                .map(Product::getName)
                .orElse("Sản phẩm #" + review.getProductId());

        return ReviewResponse.builder()
                .id(review.getId())
                .productId(review.getProductId())
                .productName(productName)
                .orderId(review.getOrderId())
                .userId(review.getUserId())
                .userDisplayName(displayName)
                .skuId(review.getSku() != null ? review.getSku().getId() : null)
                .skuName(skuName)
                .rating(review.getRating())
                .comment(review.getComment())
                .status(review.getStatus())
                .verifiedPurchase(review.isVerifiedPurchase())
                .createdAt(review.getCreatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public Page<ReviewDetailResponse> getPendingWithFilter(
            Integer minRating, Integer maxRating,
            String productName, LocalDateTime fromDate,
            Pageable pageable
    ) {
        return reviewRepository.findPendingWithFilter(
                ReviewStatus.PENDING, minRating, maxRating, productName, fromDate, pageable
        ).map(this::toDetailResponse);
    }

    @Transactional
    public List<Long> bulkApprove(List<Long> reviewIds) {
        List<Review> reviews = reviewRepository.findAllById(reviewIds);
        reviews.forEach(r -> r.setStatus(ReviewStatus.APPROVED));
        reviewRepository.saveAll(reviews);
        return reviews.stream().map(Review::getId).toList();
    }

    @Transactional
    public List<Long> bulkReject(List<Long> reviewIds) {
        List<Review> reviews = reviewRepository.findAllById(reviewIds);
        reviews.forEach(r -> r.setStatus(ReviewStatus.REJECTED));
        reviewRepository.saveAll(reviews);
        return reviews.stream().map(Review::getId).toList();
    }

    private ReviewDetailResponse toDetailResponse(Review r) {
        // Build optionSummary: "Đỏ - M"
        String optionSummary = null;
        if (r.getSku() != null && r.getSku().getValues() != null) {
            optionSummary = r.getSku().getValues().stream()
                    .map(sv -> sv.getOptionValue().getValue())
                    .collect(Collectors.joining(" - "));
        }

        // Lấy tên thật của User
        String fullName = userRepository.findById(r.getUserId())
                .map(u -> u.getFullName() != null ? u.getFullName() : u.getUsername())
                .orElse("Người dùng ẩn danh");

        // Lấy tên sản phẩm an toàn
        String pName = null;
        if (r.getSku() != null && r.getSku().getProduct() != null) {
            pName = r.getSku().getProduct().getName();
        } else {
            pName = productRepository.findById(r.getProductId())
                    .map(Product::getName)
                    .orElse("Sản phẩm #" + r.getProductId());
        }

        return ReviewDetailResponse.builder()
                .id(r.getId())
                .rating(r.getRating())
                .comment(r.getComment())
                .status(r.getStatus())
                .verifiedPurchase(r.isVerifiedPurchase())
                .createdAt(r.getCreatedAt())
                .orderId(r.getOrderId()) // <-- Map Order ID
                .product(ReviewDetailResponse.ProductInfo.builder()
                        .id(r.getProductId())
                        .name(pName)
                        .build())
                .sku(r.getSku() != null
                        ? ReviewDetailResponse.SkuInfo.builder()
                        .id(r.getSku().getId())
                        .code(r.getSku().getCode())
                        .optionSummary(optionSummary)
                        .build()
                        : null)
                .user(ReviewDetailResponse.UserInfo.builder()
                        .id(r.getUserId())
                        .fullName(fullName)
                        .build())
                .build();
    }
}