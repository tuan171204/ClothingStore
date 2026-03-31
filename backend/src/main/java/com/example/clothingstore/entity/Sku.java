package com.example.clothingstore.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "skus")
@Data
@EqualsAndHashCode(exclude = {"product", "values"})
@ToString(exclude = {"product", "values"})
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

    private BigDecimal importPrice; // giá nhập bình quân (weighted average)

    /**
     * Tỷ lệ lợi nhuận % cho SKU này (VD: 30.00 = 30%).
     * Giá bán = giá nhập * (1 + profitMargin/100)
     */
    @Column(name = "profit_margin", precision = 5, scale = 2)
    private BigDecimal profitMargin;

    @Column(name = "stock_quantity")
    private Integer stockQuantity;

    @Column(columnDefinition = "boolean default true")
    @Builder.Default
    private Boolean isActive = true;

    private String imgUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @OneToMany(mappedBy = "sku", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<SkuValue> values = new LinkedHashSet<>();
}