package com.example.clothingstore.dtos.user.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor
public class UpdateUserStatusRequest {
    @NotNull(message = "Trạng thái không được để trống")
    private Boolean active;
 
    private String reason; // Optional: reason for disabling
}