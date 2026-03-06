package com.example.clothingstore.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "sku_values")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SkuValue {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sku_id")
    private Sku sku;

    @Column(columnDefinition = "boolean default true")
    @Builder.Default
    private Boolean isActive = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "option_value_id")
    private ProductOptionValue optionValue;
}
