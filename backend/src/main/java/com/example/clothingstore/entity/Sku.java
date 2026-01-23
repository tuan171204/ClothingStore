package com.example.clothingstore.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "skus")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Sku {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String code; // mã SKU

    private BigDecimal price; // giá bán riêng của biến thể này

    @Column(name = "stock_quantity")
    private Integer stockQuantity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    // Liên kết để biết SKU này gồm những giá trị nào (VD: Màu Đỏ + Size L)
    @OneToMany(mappedBy = "sku", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SkuValue> values = new ArrayList<>();
}
