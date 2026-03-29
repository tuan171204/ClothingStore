package com.example.clothingstore.dtos.user.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

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
    String avatar;
    LocalDate createdAt;
    LocalDate updatedAt;
    Boolean active;
    RoleResponse role;
}
