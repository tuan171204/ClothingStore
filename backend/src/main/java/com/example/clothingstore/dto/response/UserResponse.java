package com.example.clothingstore.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserResponse {
    String id;
    String username;
    String fullName;
    String phoneNumber;
    String email;
    LocalDate dob;
    LocalDate createdAt;
    LocalDate updatedAt;
    Boolean active;
}
