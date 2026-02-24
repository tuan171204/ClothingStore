package com.example.clothingstore.entity;

import com.example.clothingstore.entity.Enum.MembershipTier;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "customers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Customer {

    @Id
    private String id; // ID này sẽ giống hệt User ID

    @OneToOne
    @MapsId // Quan trọng: Copy ID từ User sang đây làm PK
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "loyalty_points")
    private int loyaltyPoints = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "membership_tier")
    private MembershipTier membershipTier = MembershipTier.BRONZE;

    @Column(name = "phone_number", unique = true)
    private String phoneNumber;

    @Column(name = "birth_date")
    private LocalDate birthDate;
}