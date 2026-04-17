package com.example.clothingstore.dtos.report;
 
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import java.math.BigDecimal;
 
@Data @Builder @NoArgsConstructor @AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RevenueReportDTO {
    private String period;
    private BigDecimal revenue;
    private Long orderCount;
    private BigDecimal averageOrderValue;
    private BigDecimal grossProfit;
}