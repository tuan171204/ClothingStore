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
     */
    @Transactional
    public Order createOrder(OrderDTO orderDTO){
        // 1. Khởi tạo đơn hàng
        Order order = orderMapper.toOrder(orderDTO);

        // Lấy thông tin người dùng hiện tại
        var context = SecurityContextHolder.getContext();
        String userName = context.getAuthentication().getName();
        User user = userRepository.findByUsername(userName).orElseThrow(
                () -> new RuntimeException("User not found !")
        );

        order.setUserId(user.getId());

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

    /**
     * CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG
     */
    public void updateOrderStatus(Long orderId, OrderStatus status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng ID: " + orderId));

        order.setStatus(status);
        Order updatedOrder = orderRepository.save(order);

        if (status == OrderStatus.CONFIRMED) {
            orderProducer.sendOrderConfirmation(updatedOrder.getId());
        }
    }

    /**
     * HÀM DUYỆT ĐƠN HÀNG VÀ GỬI SANG GHN
     */
    @Transactional
    public Order confirmAndShipOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        // Chỉ duyệt đơn đang PENDING hoặc đã thanh toán (CONFIRMED)
        if (order.getStatus() == OrderStatus.SHIPPING || order.getStatus() == OrderStatus.COMPLETED) {
            throw new RuntimeException("Đơn hàng này đang giao hoặc đã xong rồi!");
        }

        // 1. Gọi GHN tạo vận đơn
        // Lưu ý: districtId và wardCode nên được lưu trong Order lúc tạo đơn để chính xác.
        // Ở đây mình tạm hardcode hoặc giả định bạn parse từ address string (nhưng tốt nhất là lưu ID lúc tạo)
        // Ví dụ tạm: 1454 (Quận 7), 20308 (Phường Tân Hưng) -> Cần lấy từ Frontend gửi xuống lúc tạo đơn
        int districtId = 1454; // TODO: Lấy từ order.getDistrictId()
        String wardCode = "20308"; // TODO: Lấy từ order.getWardCode()

        String trackingCode = ghnService.createShippingOrder(order);

        // 2. Cập nhật thông tin
        order.setTrackingCode(trackingCode);
        order.setStatus(OrderStatus.SHIPPING);

        // 3. Lưu xuống DB
        Order savedOrder = orderRepository.save(order);

        // 4. Gửi mail thông báo cho khách (Bắn message RabbitMQ)
        // Bạn có thể update OrderMessage để chứa thêm "type" (Vd: TYPE_SHIPPING)
        orderProducer.sendOrderConfirmation(savedOrder.getId());

        return savedOrder;
    }
}
