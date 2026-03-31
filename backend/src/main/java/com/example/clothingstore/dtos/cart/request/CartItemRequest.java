package com.example.clothingstore.dtos.cart.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CartItemRequest {
    @NotNull
    private Long skuId;

    @NotNull
    @Min(value = 1, message = "Số lượng phải >= 1")
    private Integer quantity;
}