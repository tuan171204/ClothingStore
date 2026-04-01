package com.example.clothingstore.dtos.order.response;

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

    private BigDecimal totalAmount;
    private BigDecimal shippingFee;

    private String paymentMethod;
    private OrderStatus status;

    // GHN Tracking
    private String trackingCode;

    /**
     * Raw status code của GHN (VD: "delivering", "delivered").
     * Dùng để Front-end hiển thị icon trạng thái chính xác.
     */
    private String trackingStatus;

    /**
     * Thông báo thân thiện cho khách hàng xem.
     * VD: "Shipper đang giao hàng đến bạn"
     */
    private String trackingMessage;

    private List<OrderItemResponse> orderItems;

    @Data
    @Builder
    public static class OrderItemResponse {
        private Long id;
        private Long skuId;
        private Long productId;
        private String productName;
        private int quantity;
        private BigDecimal price;
        private BigDecimal subtotal;
    }
}