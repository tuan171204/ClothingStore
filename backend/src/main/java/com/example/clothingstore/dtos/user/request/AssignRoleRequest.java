package com.example.clothingstore.dtos.user.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request body cho PATCH /management/users/{userId}/role
 */
@Data
public class AssignRoleRequest {

    @NotBlank(message = "Role không được để trống")
    private String role;
}