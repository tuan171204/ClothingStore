package com.example.clothingstore.dtos.user.request;

import lombok.*;
import java.time.LocalDate;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UserFilterRequest {
    private String keyword;      // Search by name, email, phone
    private String role;         // USER, STAFF, ADMIN
    private Boolean active;      // true/false/null (all)
    private String provider;     // LOCAL, GOOGLE
    private LocalDate fromDate;  // Created from
    private LocalDate toDate;    // Created to
    private int page = 0;
    private int size = 20;
}