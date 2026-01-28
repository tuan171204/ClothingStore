package com.example.clothingstore.service;

import com.example.clothingstore.dto.OrderDTO;
import com.example.clothingstore.entity.Order;
import com.example.clothingstore.entity.OrderItem;
import com.example.clothingstore.entity.OrderStatus;
import com.example.clothingstore.entity.Sku;
import com.example.clothingstore.mapper.OrderMapper;
import com.example.clothingstore.repository.OrderItemRepository;
import com.example.clothingstore.repository.OrderRepository;
import com.example.clothingstore.repository.SkuRepository;
import com.example.clothingstore.service.rabbitmq.OrderProducer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final SkuRepository skuRepository;
    private final OrderMapper orderMapper;
    private final OrderProducer orderProducer;

    @Transactional
    public Order createOrder(OrderDTO orderDTO){
        // 1. Khởi tạo đơn hàng
        Order order = orderMapper.toOrder(orderDTO);

        // 2. Tính toán tổng tiền hàng (Subtotal) từ danh sách items và trừ tồn kho
        BigDecimal subtotal = BigDecimal.ZERO;

        // Lưu danh sách items để save sau
        List<OrderItem> orderItems = new ArrayList<>();

        for (OrderDTO.CartItemDTO itemDTO : orderDTO.getItems()) {
            // --- LOGIC: TRỪ TỒN KHO ---

            // A. Tìm SKU trong Database
            Sku sku = skuRepository.findById(itemDTO.getSkuId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm có ID: " + itemDTO.getSkuId()));

            // B. Kiểm tra số lượng tồn
            if (sku.getStockQuantity() < itemDTO.getQuantity()) {
                // Nếu không đủ hàng -> Ném lỗi -> @Transactional sẽ Rollback toàn bộ (Không lưu Order nữa)
                throw new RuntimeException("Sản phẩm '" + itemDTO.getName() + "' hiện chỉ còn " + sku.getStockQuantity() + " cái (Bạn đặt " + itemDTO.getQuantity() + ")");
            }

            // C. Trừ tồn kho & Lưu lại
            sku.setStockQuantity(sku.getStockQuantity() - itemDTO.getQuantity());
            skuRepository.save(sku);

            // ----------------------------------

            // D. Tính toán giá tiền
            BigDecimal itemTotal = itemDTO.getPrice().multiply(BigDecimal.valueOf(itemDTO.getQuantity()));
            subtotal = subtotal.add(itemTotal);

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .skuId(itemDTO.getSkuId())
                    .productName(itemDTO.getName())
                    .quantity(itemDTO.getQuantity())
                    .priceAtPurchase(itemDTO.getPrice())
                    .build();

            orderItems.add(orderItem);
        }

        // 3. Set các giá trị tính toán vào Order
        order.setSubtotal(subtotal);
        // Total = Subtotal + Ship - Discount
        order.setTotalAmount(subtotal.add(orderDTO.getShippingFee()));

        // 4. Lưu Order xuống DB trước để lấy ID
        Order savedOrder = orderRepository.save(order);

        // 5. Lưu danh sách Order Items
        orderItemRepository.saveAll(orderItems);

        if ("COD".equals(savedOrder.getPaymentMethod())) {
            orderProducer.sendOrderConfirmation(savedOrder.getId());
        }

        return savedOrder;
    }

    public void updateOrderStatus(Long orderId, OrderStatus status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng ID: " + orderId));

        order.setStatus(status);
        Order updatedOrder = orderRepository.save(order);

        if (status == OrderStatus.CONFIRMED) {
            orderProducer.sendOrderConfirmation(updatedOrder.getId());
        }
    }
}
