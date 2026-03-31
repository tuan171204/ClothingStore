package com.example.clothingstore.dtos.user.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserUpdateRequest {
    String password;
    String fullName;
    String phoneNumber;
    String email;
    LocalDate dob;
    String avatar;
    Boolean active;
}
