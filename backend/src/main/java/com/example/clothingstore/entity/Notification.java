package com.example.clothingstore.entity;

import com.example.clothingstore.entity.Enum.NotificationType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Nếu gửi cho 1 user cụ thể thì lưu userId. Nếu gửi cho toàn bộ Admin thì để null (hoặc "ADMIN_GROUP")
    @Column(name = "recipient_id")
    private String recipientId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    // Lưu referenceId (VD: orderId, skuId) để khi click vào thông báo trên UI có thể redirect đến đúng trang
    @Column(name = "reference_id")
    private String referenceId;

    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private boolean isRead = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}