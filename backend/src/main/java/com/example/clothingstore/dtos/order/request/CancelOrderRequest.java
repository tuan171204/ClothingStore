package com.example.clothingstore.dtos.order.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request body cho API hủy đơn hàng từ phía khách hàng.
 */
@Data
public class CancelOrderRequest {

    @NotBlank(message = "Lý do hủy đơn không được để trống")
    private String reason;
}