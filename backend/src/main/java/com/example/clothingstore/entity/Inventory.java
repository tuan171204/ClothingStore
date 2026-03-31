package com.example.clothingstore.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * INV-001: Bảng tồn kho chính, theo dõi trạng thái stock per SKU.
 * available_quantity = physical_quantity - reserved_quantity
 * defect_quantity là bucket riêng, không tính vào physical.
 */
@Entity
@Table(name = "inventory")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Inventory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sku_id", unique = true, nullable = false)
    private Sku sku;

    /** Tổng số lượng thực tế trong kho (chỉ tính hàng QC đạt từ GRN) */
    @Column(name = "physical_quantity", nullable = false)
    @Builder.Default
    private Integer physicalQuantity = 0;

    /** Số lượng có thể bán = physical - reserved */
    @Column(name = "available_quantity", nullable = false)
    @Builder.Default
    private Integer availableQuantity = 0;

    /** Số lượng đang giữ chỗ cho đơn hàng chưa hoàn tất */
    @Column(name = "reserved_quantity", nullable = false)
    @Builder.Default
    private Integer reservedQuantity = 0;

    /** Số lượng hàng lỗi từ QC (không đưa vào available) */
    @Column(name = "defect_quantity", nullable = false)
    @Builder.Default
    private Integer defectQuantity = 0;

    /** Ngưỡng cảnh báo tồn kho thấp. 0 = chưa cấu hình */
    @Column(name = "low_stock_threshold", nullable = false)
    @Builder.Default
    private Integer lowStockThreshold = 0;

    @Version
    @Column(name = "version", nullable = false)
    @Builder.Default
    private Integer version = 0;
}