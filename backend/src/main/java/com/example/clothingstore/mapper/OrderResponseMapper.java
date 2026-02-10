package com.example.clothingstore.mapper;

import com.example.clothingstore.dto.response.OrderResponse;
import com.example.clothingstore.entity.Order;
import com.example.clothingstore.entity.OrderItem;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class OrderResponseMapper {

    public OrderResponse toOrderResponse(Order order) {
        if (order == null) return null;

        return OrderResponse.builder()
                .id(order.getId())
                .fullName(order.getFullName())
                .phoneNumber(order.getPhoneNumber())
                .shippingAddress(order.getShippingAddress())
                .note(order.getNote())
                .createdAt(order.getCreatedAt())
                .totalAmount(order.getTotalAmount())
                .shippingFee(order.getShippingFee())
                .paymentMethod(order.getPaymentMethod())
                .status(order.getStatus())
                .trackingCode(order.getTrackingCode()) // Quan trọng
                .orderItems(order.getOrderItems().stream().map(this::toItemResponse).collect(Collectors.toList()))
                .build();
    }

    private OrderResponse.OrderItemResponse toItemResponse(OrderItem item) {
        return OrderResponse.OrderItemResponse.builder()
                .id(item.getId())
                .productName(item.getProductName())
                .quantity(item.getQuantity())
                .price(item.getPriceAtPurchase())
                .subtotal(item.getPriceAtPurchase().multiply(java.math.BigDecimal.valueOf(item.getQuantity())))
                .build();
    }
}