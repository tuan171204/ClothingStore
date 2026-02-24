package com.example.clothingstore.dto.response;

import com.example.clothingstore.entity.Enum.OrderStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class OrderResponse {
    private Long id;
    private String fullName;
    private String phoneNumber;
    private String shippingAddress;
    private String note;
    private LocalDateTime createdAt;

    // Tiền nong
    private BigDecimal totalAmount;
    private BigDecimal shippingFee;

    // Trạng thái & Thanh toán
    private String paymentMethod;
    private OrderStatus status;

    // GHN Tracking
    private String trackingCode;

    // Danh sách sản phẩm
    private List<OrderItemResponse> orderItems;

    @Data
    @Builder
    public static class OrderItemResponse {
        private Long id;
        private String productName;
        private int quantity;
        private BigDecimal price;
        private BigDecimal subtotal; // quantity * price
    }
}