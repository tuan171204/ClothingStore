package com.example.clothingstore.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "product_options")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductOption {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // VD: "màu sắc", "size"
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    private Product product;

    @OneToMany(mappedBy = "productOption", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProductOptionValue> values = new ArrayList<>();

}
