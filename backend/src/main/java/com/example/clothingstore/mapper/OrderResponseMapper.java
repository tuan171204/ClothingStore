package com.example.clothingstore.mapper;

import com.example.clothingstore.dtos.order.response.OrderResponse;
import com.example.clothingstore.entity.Order;
import com.example.clothingstore.entity.OrderItem;
import com.example.clothingstore.repository.SkuRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class OrderResponseMapper {

    private final SkuRepository skuRepository;

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
                .skuId(item.getSkuId())
                .productId(resolveProductId(item.getSkuId()))
                .productName(item.getProductName())
                .quantity(item.getQuantity())
                .price(item.getPriceAtPurchase())
                .subtotal(item.getPriceAtPurchase().multiply(java.math.BigDecimal.valueOf(item.getQuantity())))
                .build();
    }

    private Long resolveProductId(Long skuId) {
        if (skuId == null) {
            return null;
        }

        return skuRepository.findById(skuId)
                .map(sku -> sku.getProduct() != null ? sku.getProduct().getId() : null)
                .orElse(null);
    }
}