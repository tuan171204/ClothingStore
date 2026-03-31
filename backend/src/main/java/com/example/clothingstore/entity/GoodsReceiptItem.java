package com.example.clothingstore.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * INV-002 + INV-003: Từng dòng hàng trong phiếu nhập kho.
 * Lưu dữ liệu QC: received = passed + failed.
 * Chỉ quantity_passed mới được cộng vào tồn kho khi GRN xác nhận.
 * importPrice: Giá nhập cho lô hàng này (dùng tính giá nhập bình quân).
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

    /** Giá nhập cho lô này (VNĐ) - dùng để tính giá nhập bình quân */
    @Column(name = "import_price", precision = 15, scale = 2)
    private BigDecimal importPrice;
}