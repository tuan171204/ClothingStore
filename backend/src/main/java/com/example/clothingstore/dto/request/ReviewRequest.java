package com.example.clothingstore.dto.request;

import lombok.Data;

@Data
public class ReviewRequest {
    private Integer rating;
    private String comment;
}
