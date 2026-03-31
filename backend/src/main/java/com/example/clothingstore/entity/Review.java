package com.example.clothingstore.entity;

import com.example.clothingstore.entity.Enum.ReviewStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "reviews")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "user_id", nullable = false)
    private String userId;

    /** orderId: Track review thuộc về đơn hàng nào (QUAN TRỌNG để check duplicate) */
    @Column(name = "order_id")
    private Long orderId;

    @Column(name = "rating", nullable = false)
    private Integer rating; // 1–5

    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    @Builder.Default
    private ReviewStatus status = ReviewStatus.PENDING;

    @Column(name = "verified_purchase")
    @Builder.Default
    private boolean verifiedPurchase = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sku_id")
    private Sku sku;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = ReviewStatus.PENDING;
    }
}