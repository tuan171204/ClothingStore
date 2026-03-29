package com.example.clothingstore.service.impl;

import com.example.clothingstore.dtos.dto.OrderDTO;
import com.example.clothingstore.dtos.order.request.OrderFilterRequest;
import com.example.clothingstore.dtos.order.response.OrderResponse;
import com.example.clothingstore.dtos.PagedResponse;
import com.example.clothingstore.entity.Order;
import com.example.clothingstore.entity.OrderItem;
import com.example.clothingstore.entity.Enum.OrderStatus;
import com.example.clothingstore.entity.Sku;
import com.example.clothingstore.entity.User;
import com.example.clothingstore.mapper.OrderMapper;
import com.example.clothingstore.mapper.OrderResponseMapper;
import com.example.clothingstore.repository.OrderItemRepository;
import com.example.clothingstore.repository.OrderRepository;
import com.example.clothingstore.repository.SkuRepository;
import com.example.clothingstore.repository.UserRepository;
import com.example.clothingstore.repository.specification.OrderSpecification;
import com.example.clothingstore.service.InventoryService;
import com.example.clothingstore.service.rabbitmq.OrderProducer;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final GhnService ghnService;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final SkuRepository skuRepository;
    private final OrderMapper orderMapper;
    private final OrderResponseMapper orderResponseMapper;
    private final OrderProducer orderProducer;
    private final InventoryService inventoryService;

    // =========================================================
    // LẤY DANH SÁCH ĐƠN HÀNG (CÓ FILTER + PHÂN TRANG)
    // =========================================================

    /**
     * API chính cho Admin: Filter + phân trang
     */
    public PagedResponse<OrderResponse> getOrdersWithFilter(OrderFilterRequest filter) {
        Specification<Order> spec = OrderSpecification.buildSpec(filter);

        Pageable pageable = PageRequest.of(
                filter.getPage(),
                filter.getSize(),
                Sort.by("createdAt").descending()
        );

        Page<Order> page = orderRepository.findAll(spec, pageable);

        List<OrderResponse> content = page.getContent().stream()
                .map(orderResponseMapper::toOrderResponse)
                .collect(Collectors.toList());

        return PagedResponse.<OrderResponse>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    /**
     * Tổng tiền theo filter (cho thống kê)
     */
    public BigDecimal getTotalAmountByFilter(OrderFilterRequest filter) {
        Specification<Order> spec = OrderSpecification.buildSpec(filter);
        // Lấy tất cả không phân trang để tính tổng
        Pageable all = PageRequest.of(0, Integer.MAX_VALUE);
        Page<Order> page = orderRepository.findAll(spec, all);

        return page.getContent().stream()
                .filter(o -> o.getStatus() != OrderStatus.CANCELLED)
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    // =========================================================
    // CÁC PHƯƠNG THỨC GIỮ NGUYÊN TỪ TRƯỚC
    // =========================================================

    public List<OrderResponse> getAllOrders() {
        List<Order> orders = orderRepository.findAllByOrderByCreatedAtDesc();
        return orders.stream()
                .map(orderResponseMapper::toOrderResponse)
                .collect(Collectors.toList());
    }

    public OrderResponse getOrderById(Long id) {
        Order order = orderRepository.findByIdWithItems(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng ID: " + id));
        return orderResponseMapper.toOrderResponse(order);
    }

    public List<OrderResponse> getOrderByUserId(String userId) {
        List<Order> orders = orderRepository.findByUserId(userId);
        return orders.stream()
                .map(orderResponseMapper::toOrderResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public Order createOrder(OrderDTO orderDTO) {
        Order order = orderMapper.toOrder(orderDTO);

        var context = SecurityContextHolder.getContext();
        String userName = context.getAuthentication().getName();
        User user = userRepository.findByUsername(userName)
                .orElseThrow(() -> new RuntimeException("User not found!"));

        order.setUserId(user.getId());

        BigDecimal subtotal = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        for (OrderDTO.CartItemDTO itemDTO : orderDTO.getItems()) {
            Sku sku = skuRepository.findById(itemDTO.getSkuId())
                    .orElseThrow(() -> new RuntimeException(
                            "Không tìm thấy sản phẩm có ID: " + itemDTO.getSkuId()));

            inventoryService.getOrCreateInventory(sku);

            if (sku.getStockQuantity() < itemDTO.getQuantity()) {
                throw new RuntimeException(
                        "Sản phẩm '" + itemDTO.getName() + "' hiện chỉ còn "
                                + sku.getStockQuantity() + " cái (Bạn đặt " + itemDTO.getQuantity() + ")");
            }

            sku.setStockQuantity(sku.getStockQuantity() - itemDTO.getQuantity());
            skuRepository.save(sku);
            inventoryService.reserveStock(sku.getId(), itemDTO.getQuantity());

            BigDecimal itemTotal = itemDTO.getPrice().multiply(BigDecimal.valueOf(itemDTO.getQuantity()));
            subtotal = subtotal.add(itemTotal);

            orderItems.add(OrderItem.builder()
                    .order(order)
                    .skuId(itemDTO.getSkuId())
                    .productName(itemDTO.getName())
                    .quantity(itemDTO.getQuantity())
                    .priceAtPurchase(itemDTO.getPrice())
                    .build());
        }

        order.setSubtotal(subtotal);
        order.setTotalAmount(subtotal.add(orderDTO.getShippingFee()));

        Order savedOrder = orderRepository.save(order);
        orderItemRepository.saveAll(orderItems);

        if ("COD".equals(savedOrder.getPaymentMethod())) {
            orderProducer.sendOrderConfirmation(savedOrder.getId());
        }

        return savedOrder;
    }

    @Transactional
    public void updateOrderStatus(Long orderId, OrderStatus status) {
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng ID: " + orderId));

        OrderStatus previousStatus = order.getStatus();
        order.setStatus(status);
        Order updatedOrder = orderRepository.save(order);

        if (status == OrderStatus.CONFIRMED) {
            orderProducer.sendOrderConfirmation(updatedOrder.getId());
        }

        if (status == OrderStatus.CANCELLED
                && previousStatus != OrderStatus.CANCELLED
                && previousStatus != OrderStatus.COMPLETED) {

            List<OrderItem> items = order.getOrderItems();
            if (items != null) {
                for (OrderItem item : items) {
                    skuRepository.findById(item.getSkuId()).ifPresent(sku -> {
                        sku.setStockQuantity(sku.getStockQuantity() + item.getQuantity());
                        skuRepository.save(sku);
                    });
                    inventoryService.releaseStock(item.getSkuId(), item.getQuantity());
                }
            }
        }

        if (status == OrderStatus.COMPLETED && previousStatus != OrderStatus.COMPLETED) {
            List<OrderItem> items = order.getOrderItems();
            if (items != null) {
                for (OrderItem item : items) {
                    inventoryService.deductStock(item.getSkuId(), item.getQuantity());
                }
            }
        }
    }

    @Transactional
    public Order confirmAndShipOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        if (order.getStatus() == OrderStatus.SHIPPING || order.getStatus() == OrderStatus.COMPLETED) {
            throw new RuntimeException("Đơn hàng này đang giao hoặc đã xong rồi!");
        }

        String trackingCode = ghnService.createShippingOrder(order);

        order.setTrackingCode(trackingCode);
        order.setStatus(OrderStatus.SHIPPING);

        Order savedOrder = orderRepository.save(order);
        orderProducer.sendOrderConfirmation(savedOrder.getId());

        return savedOrder;
    }
}