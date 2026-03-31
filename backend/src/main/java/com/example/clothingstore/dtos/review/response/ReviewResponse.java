package com.example.clothingstore.dtos.review.response;

import com.example.clothingstore.entity.Enum.ReviewStatus;
import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResponse {
    private Long id;
    private Long productId;
    private String productName;
    private Long orderId;
    private String userId;
    private String userDisplayName;
    private Integer rating;
    private String comment;
    private ReviewStatus status;
    private boolean verifiedPurchase;
    private LocalDateTime createdAt;

    // Thông tin SKU đã mua
    private Long skuId;
    private String skuName;
}
