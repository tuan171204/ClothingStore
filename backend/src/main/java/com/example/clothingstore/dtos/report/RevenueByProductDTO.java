package com.example.clothingstore.dtos.report;
 
import lombok.*;
import java.math.BigDecimal;
 
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class RevenueByProductDTO {
    private Long productId;
    private String productName;
    private String categoryName;
    private String brandName;
    private Long quantitySold;
    private BigDecimal revenue;
    private BigDecimal revenueShare;
}