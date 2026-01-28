package com.example.clothingstore.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "order_id")
    private Order order;

    @Column(name = "sku_id")
    private Long skuId; // Tạm thời lưu ID, sau này map với bảng SKU nếu cần

    @Column(name = "product_name") // Lưu thêm tên SP để hiển thị nhanh lịch sử
    private String productName;

    @Column(name = "quantity")
    private int quantity;

    @Column(name = "price_at_purchase")
    private BigDecimal priceAtPurchase; // Giá tại thời điểm mua
}