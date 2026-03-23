package com.example.clothingstore.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * INV-002 + INV-003: Từng dòng hàng trong phiếu nhập kho.
 * Lưu dữ liệu QC: received = passed + failed.
 * Chỉ quantity_passed mới được cộng vào tồn kho khi GRN xác nhận.
 */
@Entity
@Table(name = "goods_receipt_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoodsReceiptItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grn_id", nullable = false)
    private GoodsReceipt goodsReceipt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sku_id", nullable = false)
    private Sku sku;

    /** Tổng số lượng nhận từ nhà cung cấp */
    @Column(name = "quantity_received", nullable = false)
    private Integer quantityReceived;

    /** Số lượng đạt QC → cộng vào physical + available */
    @Column(name = "quantity_passed", nullable = false)
    @Builder.Default
    private Integer quantityPassed = 0;

    /** Số lượng lỗi QC → cộng vào defect_quantity */
    @Column(name = "quantity_failed", nullable = false)
    @Builder.Default
    private Integer quantityFailed = 0;
}