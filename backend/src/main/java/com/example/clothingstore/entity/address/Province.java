package com.example.clothingstore.entity.address;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "provinces")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Province {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name")
    private String name;

    // Mã ID của GHTK (VD: Hà Nội = 1) -> Dùng để mapping khi tính ship
    @Column(name = "ghtk_id")
    private Long ghtkId;

    @OneToMany(mappedBy = "province", cascade = CascadeType.ALL)
    @JsonIgnore // Chặn vòng lặp khi trả về JSON
    private List<District> districts;
}