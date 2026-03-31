package com.example.clothingstore.dtos.review.response;

import com.example.clothingstore.entity.Enum.ReviewStatus;
import lombok.*;

import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ReviewDetailResponse {
    private Long id;
    private Long orderId;
    private Integer rating;
    private String comment;
    private ReviewStatus status;
    private boolean verifiedPurchase;
    private LocalDateTime createdAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductInfo {
        private Long id;
        private String name;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SkuInfo {
        private Long id;
        private String code;
        private String optionSummary;  // "Đỏ - M"
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
        private String id;
        private String fullName;
        private String email;
    }

    private ProductInfo product;
    private SkuInfo sku;
    private UserInfo user;
}
