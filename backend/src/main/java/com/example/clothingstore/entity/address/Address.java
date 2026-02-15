package com.example.clothingstore.entity.address;

import com.example.clothingstore.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "addresses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Address {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Quan hệ N-1 với User
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    private String streetAddress; // Số nhà, tên đường

    // Quan trọng để tính phí Ship
    private Integer provinceId;
    private String provinceName;

    private Integer districtId;
    private String districtName;

    private String wardCode; // GHN dùng String cho mã phường
    private String wardName;

    private String phone; // SĐT người nhận tại địa chỉ này
    private String receiverName; // Tên người nhận

    @Column(name = "is_default")
    private boolean isDefault = false;
}