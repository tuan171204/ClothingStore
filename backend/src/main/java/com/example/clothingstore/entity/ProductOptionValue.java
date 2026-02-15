package com.example.clothingstore.entity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "product_option_values")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductOptionValue {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String value; // VD: "Red", "XL"

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "option_id")
    private ProductOption productOption;

}
