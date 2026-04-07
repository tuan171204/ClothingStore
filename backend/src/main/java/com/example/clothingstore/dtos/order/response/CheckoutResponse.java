package com.example.clothingstore.dtos.order.response;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckoutResponse {

    public enum Status { SUCCESS, OUT_OF_STOCK, PARTIAL_AVAILABLE }

    private Status status;
    private Long orderId;
    private String message;
    private BigDecimal totalAmount;
    private BigDecimal discountAmount;
    private String appliedCouponCode;

    // Danh sách item có vấn đề (để frontend highlight)
    private List<StockMismatch> stockMismatches;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StockMismatch {
        private Long skuId;
        private String productName;
        private String variantName;
        private int requestedQuantity;
        private int availableQuantity;   // 0 = hết hàng
        private boolean canPartialFulfill; // true = còn hàng nhưng ít hơn yêu cầu
        // Message để frontend hiển thị thẳng
        private String userMessage;
    }
}