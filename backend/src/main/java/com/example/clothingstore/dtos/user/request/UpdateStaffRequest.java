package com.example.clothingstore.dtos.user.request;

import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDate;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateStaffRequest {
 
    @Size(max = 100)
    private String fullName;
 
    @Email
    private String email;
 
    @Pattern(regexp = "^(0[35789]\\d{8})?$")
    private String phoneNumber;
 
    private LocalDate dob;
    private String avatar;
 
    @Pattern(regexp = "^(STAFF|ADMIN)?$")
    private String role;
}