package com.example.clothingstore.dtos.user.response;

import lombok.*;
import java.time.LocalDate;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UserDetailResponse {
    private String id;
    private String username;
    private String fullName;
    private String email;
    private String phoneNumber;
    private LocalDate dob;
    private String avatar;
    private boolean active;
    private String role;
    private String provider;     // LOCAL or GOOGLE
    private LocalDate createdAt;
    private LocalDate updatedAt;
 
    // Customer-specific stats (null for staff)
    private Long totalOrders;
    private java.math.BigDecimal totalSpent;
    private String membershipTier;
}