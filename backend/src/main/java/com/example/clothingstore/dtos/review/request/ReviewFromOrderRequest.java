package com.example.clothingstore.dtos.review.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class ReviewFromOrderRequest {
    @NotNull
    private Long orderId;

    @NotNull
    private Long skuId;

    @NotNull
    private Long productId;

    @NotNull
    @Min(1) @Max(5)
    private Integer rating;

    @NotBlank(message = "Vui lòng nhập nội dung đánh giá")
    @Size(max = 2000)
    private String comment;
}