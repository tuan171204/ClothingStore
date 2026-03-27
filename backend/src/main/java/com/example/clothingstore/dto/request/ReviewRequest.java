package com.example.clothingstore.dto.request;

import lombok.Data;

@Data
public class ReviewRequest {
    private Integer rating;
    private String comment;
    private Long skuId; // Thêm trường SKU để biết chính xác biến thể nào được đánh giá
}
