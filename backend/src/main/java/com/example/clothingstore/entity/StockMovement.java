package com.example.clothingstore.entity;

import com.example.clothingstore.entity.Enum.StockMovementType;
import com.example.clothingstore.entity.Enum.StockReferenceType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * INV-006: Audit log toàn bộ biến động tồn kho.
 * Mọi thay đổi inventory đều phải ghi một bản ghi vào bảng này.
 */
@Entity
@Table(name = "stock_movements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockMovement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sku_id", nullable = false)
    private Sku sku;

    @Enumerated(EnumType.STRING)
    @Column(name = "movement_type", nullable = false)
    private StockMovementType movementType;

    /** Số lượng thay đổi (luôn dương, chiều được xác định bởi movementType) */
    @Column(nullable = false)
    private Integer quantity;

    @Enumerated(EnumType.STRING)
    @Column(name = "reference_type")
    private StockReferenceType referenceType;

    /** ID tham chiếu (Order ID, GRN ID, Adjustment ID) */
    @Column(name = "reference_id")
    private String referenceId;

    /** available_quantity TRƯỚC khi thay đổi */
    @Column(name = "before_quantity", nullable = false)
    private Integer beforeQuantity;

    /** available_quantity SAU khi thay đổi */
    @Column(name = "after_quantity", nullable = false)
    private Integer afterQuantity;

    @Column(columnDefinition = "TEXT")
    private String note;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}