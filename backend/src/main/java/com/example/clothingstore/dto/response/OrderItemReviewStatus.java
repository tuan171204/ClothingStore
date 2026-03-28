package com.example.clothingstore.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemReviewStatus {
    private Long orderItemId;
    private Long skuId;
    private Long productId;
    private String productName;
    private String skuName;
    private String thumbnailUrl;
    private boolean reviewed;       // Đã review chưa
    private Long existingReviewId;  // Nếu đã review thì ID của review đó
    private Integer existingRating;
    private String existingComment;
    private String reviewStatus;    // PENDING / APPROVED / REJECTED
}