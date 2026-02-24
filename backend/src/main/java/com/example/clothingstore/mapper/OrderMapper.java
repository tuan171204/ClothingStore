package com.example.clothingstore.mapper;

import com.example.clothingstore.dto.OrderDTO;
import com.example.clothingstore.entity.Order;
import com.example.clothingstore.entity.Enum.OrderStatus;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.math.BigDecimal;

@Mapper(componentModel = "spring", imports = {BigDecimal.class, OrderStatus.class})
public interface OrderMapper {
    @Mapping(target = "shippingAddress", source = "address") // Map khác tên
    @Mapping(target = "status", expression = "java(OrderStatus.PENDING)") // Mặc định
    @Mapping(target = "discountAmount", expression = "java(BigDecimal.ZERO)") // Mặc định
    @Mapping(target = "userId", ignore = true) // Khách vãng lai -> null

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "subtotal", ignore = true)
    @Mapping(target = "totalAmount", ignore = true)
    @Mapping(target = "orderItems", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    Order toOrder(OrderDTO orderDTO);
}


