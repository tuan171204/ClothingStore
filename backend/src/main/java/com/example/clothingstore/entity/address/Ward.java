package com.example.clothingstore.entity.address;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "wards")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ward {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name")
    private String name;

    @Column(name = "ghtk_id")
    private Long ghtkId;

    @ManyToOne
    @JoinColumn(name = "district_id")
    private District district;
}