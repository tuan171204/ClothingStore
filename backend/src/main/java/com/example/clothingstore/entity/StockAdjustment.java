package com.example.clothingstore.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * INV-005: Phiếu điều chỉnh tồn kho thủ công.
 * Mọi điều chỉnh đều lưu before/after và lý do để đảm bảo audit trail.
 */
@Entity
@Table(name = "stock_adjustments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockAdjustment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sku_id", nullable = false)
    private Sku sku;

    /** ID của User thực hiện điều chỉnh */
    @Column(name = "adjusted_by")
    private String adjustedBy;

    /** Số dương = nhập thêm, số âm = xuất bớt */
    @Column(name = "quantity_change", nullable = false)
    private Integer quantityChange;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    /** physical_quantity trước điều chỉnh */
    @Column(name = "before_quantity", nullable = false)
    private Integer beforeQuantity;

    /** physical_quantity sau điều chỉnh */
    @Column(name = "after_quantity", nullable = false)
    private Integer afterQuantity;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}