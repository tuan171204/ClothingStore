package com.example.clothingstore.service.impl;

import com.example.clothingstore.dto.OrderDTO;
import com.example.clothingstore.dto.response.OrderResponse;
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
import com.example.clothingstore.service.InventoryService;
import com.example.clothingstore.service.rabbitmq.OrderProducer;
import lombok.RequiredArgsConstructor;
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

    /**
     * LẤY TOÀN BỘ ĐƠN HÀNG
     */
    public List<OrderResponse> getAllOrders() {
        List<Order> orders = orderRepository.findAllByOrderByCreatedAtDesc();
        return orders.stream()
                .map(orderResponseMapper::toOrderResponse)
                .collect(Collectors.toList());
    }

    /**
     * LẤY ĐƠN HÀNG CỤ THỂ
     */
    public OrderResponse getOrderById(Long id) {
        Order order = orderRepository.findByIdWithItems(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng ID: " + id));
        return orderResponseMapper.toOrderResponse(order);
    }

    /**
     * LẤY TẤT CẢ ĐƠN HÀNG CỦA 1 KHÁCH CỤ THỂ
     */
    public List<OrderResponse> getOrderByUserId(String userId) {
        List<Order> orders = orderRepository.findByUserId(userId);
        return orders.stream()
                .map(orderResponseMapper::toOrderResponse)
                .collect(Collectors.toList());
    }

    /**
     * TẠO ĐƠN HÀNG
     * INV-001: Gọi reserveStock sau khi trừ sku.stockQuantity để đồng bộ Inventory.
     */
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
            // Tìm SKU
            Sku sku = skuRepository.findById(itemDTO.getSkuId())
                    .orElseThrow(() -> new RuntimeException(
                            "Không tìm thấy sản phẩm có ID: " + itemDTO.getSkuId()));

            // Bootstrap inventory record nếu chưa có
            // Phải gọi TRƯỚC khi trừ stockQuantity để snapshot đúng giá trị ban đầu
            inventoryService.getOrCreateInventory(sku);

            // Kiểm tra tồn kho (dùng sku.stockQuantity như hiện tại để backward-compatible)
            if (sku.getStockQuantity() < itemDTO.getQuantity()) {
                throw new RuntimeException(
                        "Sản phẩm '" + itemDTO.getName() + "' hiện chỉ còn "
                                + sku.getStockQuantity() + " cái (Bạn đặt " + itemDTO.getQuantity() + ")");
            }

            // Trừ sku.stockQuantity (giữ logic cũ)
            sku.setStockQuantity(sku.getStockQuantity() - itemDTO.getQuantity());
            skuRepository.save(sku);

            // Đồng bộ Inventory — reserve stock
            // reserveStock sẽ: available -= qty; reserved += qty
            inventoryService.reserveStock(sku.getId(), itemDTO.getQuantity());

            // Tính tiền
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

    /**
     * CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG
     * INV-001:
     *   - CANCELLED → releaseStock (hoàn lại available, giảm reserved)
     *   - COMPLETED  → deductStock (trừ physical, giảm reserved)
     */
    @Transactional
    public void updateOrderStatus(Long orderId, OrderStatus status) {
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng ID: " + orderId));

        OrderStatus previousStatus = order.getStatus();
        order.setStatus(status);
        Order updatedOrder = orderRepository.save(order);

        // Gửi email xác nhận khi thanh toán VNPay thành công
        if (status == OrderStatus.CONFIRMED) {
            orderProducer.sendOrderConfirmation(updatedOrder.getId());
        }

        // Khi hủy đơn → hoàn lại tồn kho đã reserve
        if (status == OrderStatus.CANCELLED
                && previousStatus != OrderStatus.CANCELLED
                && previousStatus != OrderStatus.COMPLETED) {

            List<OrderItem> items = order.getOrderItems();
            if (items != null) {
                for (OrderItem item : items) {
                    // Hoàn lại Sku.stockQuantity (backward-compatible)
                    skuRepository.findById(item.getSkuId()).ifPresent(sku -> {
                        sku.setStockQuantity(sku.getStockQuantity() + item.getQuantity());
                        skuRepository.save(sku);
                    });

                    // ✅ Giải phóng inventory reserve
                    inventoryService.releaseStock(item.getSkuId(), item.getQuantity());
                }
            }
        }

        // Khi hoàn thành → xuất kho thực tế (trừ physical_quantity)
        if (status == OrderStatus.COMPLETED
                && previousStatus != OrderStatus.COMPLETED) {

            List<OrderItem> items = order.getOrderItems();
            if (items != null) {
                for (OrderItem item : items) {
                    inventoryService.deductStock(item.getSkuId(), item.getQuantity());
                }
            }
        }
    }

    /**
     * HÀM DUYỆT ĐƠN HÀNG VÀ GỬI SANG GHN
     */
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