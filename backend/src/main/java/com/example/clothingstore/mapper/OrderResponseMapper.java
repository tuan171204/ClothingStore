package com.example.clothingstore.mapper;

import com.example.clothingstore.dtos.order.response.OrderResponse;
import com.example.clothingstore.entity.Order;
import com.example.clothingstore.entity.OrderItem;
import com.example.clothingstore.repository.SkuRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderResponseMapper {

    private final SkuRepository skuRepository;
    private final ObjectMapper objectMapper;

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
                // GHN tracking — read-only from webhook
                .trackingCode(order.getTrackingCode())
                .trackingStatus(order.getTrackingStatus())
                .trackingMessage(order.getTrackingMessage())
                // Cancel
                .cancelReason(order.getCancelReason())
                .cancelledAt(order.getCancelledAt())
                // Return
                .returnReason(order.getReturnReason())
                .returnDescription(order.getReturnDescription())
                .returnImageUrls(parseImageUrls(order.getReturnImages()))
                .returnRequestedAt(order.getReturnRequestedAt())
                .orderItems(order.getOrderItems().stream()
                        .map(this::toItemResponse)
                        .collect(Collectors.toList()))
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
                .subtotal(item.getPriceAtPurchase()
                        .multiply(java.math.BigDecimal.valueOf(item.getQuantity())))
                .build();
    }

    private Long resolveProductId(Long skuId) {
        if (skuId == null) return null;
        return skuRepository.findById(skuId)
                .map(sku -> sku.getProduct() != null ? sku.getProduct().getId() : null)
                .orElse(null);
    }

    /**
     * Parse JSON string lưu trong DB thành List<String>.
     * Trả về danh sách rỗng nếu null hoặc lỗi parse.
     */
    private List<String> parseImageUrls(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            log.warn("Không parse được returnImages JSON: {}", json);
            return Collections.emptyList();
        }
    }
}