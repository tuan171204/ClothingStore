package com.example.clothingstore.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "flash_sale_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FlashSaleItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flash_sale_id", nullable = false)
    private FlashSale flashSale;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sku_id", nullable = false)
    private Sku sku; //  Link trực tiếp tới Sku, không phải Product

    @Column(name = "promotional_price", nullable = false)
    private BigDecimal promotionalPrice; // Giá bán trong Flash Sale

    @Column(name = "total_quantity", nullable = false)
    private Integer totalQuantity; // Số lượng xuất kho cho đợt Sale này (vd: 50 cái)

    @Column(name = "sold_quantity", nullable = false)
    @Builder.Default
    private Integer soldQuantity = 0; // Đã bán bao nhiêu

    // Thao tác trừ tồn kho Flash Sale phải làm trên Redis, không làm trên MySQL để tránh sập DB.
}