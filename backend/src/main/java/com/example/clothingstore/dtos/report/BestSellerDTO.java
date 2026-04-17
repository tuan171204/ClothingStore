package com.example.clothingstore.dtos.report;

import lombok.*;

import java.math.BigDecimal;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class BestSellerDTO {
    private Long productId;
    private String productName;
    private String thumbnail;
    private Long quantitySold;
    private BigDecimal revenue;
    private Integer currentStock;
    private Integer rank;
}