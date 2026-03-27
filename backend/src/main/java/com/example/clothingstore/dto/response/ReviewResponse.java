package com.example.clothingstore.dto.response;

import com.example.clothingstore.entity.Enum.ReviewStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ReviewResponse {
    private Long id;
    private Long productId;
    private String userId;
    private Integer rating;
    private String comment;
    private ReviewStatus status;
    private boolean verifiedPurchase;
    private LocalDateTime createdAt;
}
