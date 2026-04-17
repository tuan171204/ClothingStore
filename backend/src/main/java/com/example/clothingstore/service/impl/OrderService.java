package com.example.clothingstore.service.impl;

import com.example.clothingstore.dtos.cart.response.CartResponse;
import com.example.clothingstore.dtos.dto.OrderDTO;
import com.example.clothingstore.dtos.order.request.CancelOrderRequest;
import com.example.clothingstore.dtos.order.request.OrderFilterRequest;
import com.example.clothingstore.dtos.order.request.ReturnOrderRequest;
import com.example.clothingstore.dtos.order.response.OrderResponse;
import com.example.clothingstore.dtos.PagedResponse;
import com.example.clothingstore.entity.Order;
import com.example.clothingstore.entity.OrderItem;
import com.example.clothingstore.entity.Enum.OrderStatus;
import com.example.clothingstore.entity.Sku;
import com.example.clothingstore.entity.User;
import com.example.clothingstore.exception.AppException;
import com.example.clothingstore.exception.ErrorCode;
import com.example.clothingstore.mapper.OrderMapper;
import com.example.clothingstore.mapper.OrderResponseMapper;
import com.example.clothingstore.repository.OrderItemRepository;
import com.example.clothingstore.repository.OrderRepository;
import com.example.clothingstore.repository.SkuRepository;
import com.example.clothingstore.repository.UserRepository;
import com.example.clothingstore.repository.specification.OrderSpecification;
import com.example.clothingstore.service.CartService;
import com.example.clothingstore.service.InventoryService;
import com.example.clothingstore.service.rabbitmq.NotificationProducer;
import com.example.clothingstore.service.rabbitmq.OrderProducer;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final GhnService          ghnService;
    private final OrderRepository     orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository      userRepository;
    private final SkuRepository       skuRepository;
    private final OrderMapper         orderMapper;
    private final OrderResponseMapper orderResponseMapper;
    private final OrderProducer       orderProducer;
    private final InventoryService    inventoryService;
    private final CartService         cartService;
    private final ObjectMapper objectMapper;
    private final NotificationProducer notificationProducer;

    private static final Set<OrderStatus> CANCELLABLE_BY_CUSTOMER = Set.of(
            OrderStatus.PENDING, OrderStatus.CONFIRMED
    );

    private static final int RETURN_WINDOW_DAYS = 30;

    // =========================================================
    // LẤY ĐƠN HÀNG (FILTER + PHÂN TRANG)
    // =========================================================

    public PagedResponse<OrderResponse> getOrdersWithFilter(OrderFilterRequest filter) {
        Specification<Order> spec = OrderSpecification.buildSpec(filter);
        Pageable pageable = PageRequest.of(filter.getPage(), filter.getSize(),
                Sort.by("createdAt").descending());
        Page<Order> page = orderRepository.findAll(spec, pageable);

        return PagedResponse.<OrderResponse>builder()
                .content(page.getContent().stream()
                        .map(orderResponseMapper::toOrderResponse)
                        .collect(Collectors.toList()))
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    public BigDecimal getTotalAmountByFilter(OrderFilterRequest filter) {
        Specification<Order> spec = OrderSpecification.buildSpec(filter);
        Slice<Order> page = orderRepository.findAll(spec, PageRequest.of(0, Integer.MAX_VALUE));
        return page.getContent().stream()
                .filter(o -> o.getStatus() != OrderStatus.CANCELLED)
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(orderResponseMapper::toOrderResponse)
                .collect(Collectors.toList());
    }

    @Cacheable(value = "order_detail", key = "#id")
    public OrderResponse getOrderById(Long id) {
        return orderResponseMapper.toOrderResponse(
                orderRepository.findByIdWithItems(id)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng ID: " + id)));
    }

    @Cacheable(value = "orders_user", key = "#userId")
    public List<OrderResponse> getOrderByUserId(String userId) {
        return orderRepository.findByUserId(userId).stream()
                .map(orderResponseMapper::toOrderResponse)
                .collect(Collectors.toList());
    }

    // =========================================================
    // TẠO ĐƠN HÀNG (legacy flow — giữ lại cho compatibility)
    // =========================================================

    @CacheEvict(value = "orders_user", key = "#result.userId")
    @Transactional
    public Order createOrder(OrderDTO orderDTO) {
        var context  = SecurityContextHolder.getContext();
        String userName = context.getAuthentication().getName();
        User user = userRepository.findByUsername(userName)
                .orElseThrow(() -> new RuntimeException("User not found!"));

        CartResponse validatedCart = cartService.getCart(user.getId());
        if (validatedCart.getItems().stream().anyMatch(CartResponse.CartItemResponse::isStockWarning)) {
            throw new RuntimeException(
                    "Một số sản phẩm trong giỏ hàng đã thay đổi tồn kho. Vui lòng kiểm tra lại.");
        }

        Order order = orderMapper.toOrder(orderDTO);
        order.setUserId(user.getId());

        BigDecimal subtotal = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        for (OrderDTO.CartItemDTO itemDTO : orderDTO.getItems()) {
            Sku sku = skuRepository.findById(itemDTO.getSkuId())
                    .orElseThrow(() -> new RuntimeException(
                            "Không tìm thấy sản phẩm có ID: " + itemDTO.getSkuId()));
            inventoryService.getOrCreateInventory(sku);
            if (sku.getStockQuantity() < itemDTO.getQuantity()) {
                throw new RuntimeException("Sản phẩm '" + itemDTO.getName() + "' hiện chỉ còn "
                        + sku.getStockQuantity() + " cái.");
            }
            sku.setStockQuantity(sku.getStockQuantity() - itemDTO.getQuantity());
            skuRepository.save(sku);
            inventoryService.reserveStock(sku.getId(), itemDTO.getQuantity());

            subtotal = subtotal.add(itemDTO.getPrice().multiply(BigDecimal.valueOf(itemDTO.getQuantity())));
            orderItems.add(OrderItem.builder()
                    .order(order).skuId(itemDTO.getSkuId())
                    .productName(itemDTO.getName()).quantity(itemDTO.getQuantity())
                    .priceAtPurchase(itemDTO.getPrice()).build());
        }

        order.setSubtotal(subtotal);
        order.setTotalAmount(subtotal.add(orderDTO.getShippingFee()));

        Order savedOrder = orderRepository.save(order);
        orderItemRepository.saveAll(orderItems);
        cartService.clearCart(user.getId());

        if ("COD".equals(savedOrder.getPaymentMethod())) {
            orderProducer.sendOrderConfirmation(savedOrder.getId());
        }
        return savedOrder;
    }

    // =========================================================
    // AUTO-CONFIRM + AUTO-SHIP (luồng mới)
    // =========================================================

    /**
     * Được gọi ngay sau khi CheckoutService tạo đơn thành công (COD)
     * hoặc sau khi VNPay callback xác nhận thanh toán.
     *
     * Luồng: PENDING → CONFIRMED → (gọi GHN) → SHIPPING
     *
     * Nếu GHN lỗi: đơn vẫn giữ CONFIRMED, log cảnh báo để Admin xử lý thủ công.
     */
    @Caching(evict = {
            @CacheEvict(value = "order_detail", key = "#orderId"),
            @CacheEvict(value = "orders_user", allEntries = true)
    })
    @Transactional
    public void autoConfirmAndShip(Long orderId) {
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng ID: " + orderId));

        if (order.getStatus() != OrderStatus.PENDING) {
            log.warn("[AutoShip] Đơn hàng {} không ở trạng thái PENDING (hiện tại: {}), bỏ qua.",
                    orderId, order.getStatus());
            return;
        }

        // Bước 1: Xác nhận đơn
        order.setStatus(OrderStatus.CONFIRMED);
        orderRepository.save(order);
        log.info("[AutoShip] Đơn hàng {} → CONFIRMED", orderId);

        // Bước 2: Gửi email xác nhận đơn cho khách
        orderProducer.sendOrderConfirmation(orderId);

        // Bước 3: Tạo vận đơn GHN
        try {
            String trackingCode = ghnService.createShippingOrder(order);
            order.setTrackingCode(trackingCode);
            order.setStatus(OrderStatus.SHIPPING);
            order.setTrackingStatus("ready_to_pick");
            order.setTrackingMessage("Đơn hàng đang chờ shipper đến lấy");
            orderRepository.save(order);
            log.info("[AutoShip] ✅ Đơn hàng {} → SHIPPING, trackingCode={}", orderId, trackingCode);
        } catch (Exception e) {
            // Giữ CONFIRMED, Admin thủ công qua nút "Duyệt & Giao GHN" trong trang Orders
            log.error("[AutoShip] ❌ Tạo vận đơn GHN thất bại cho đơn {}. " +
                    "Đơn giữ CONFIRMED để Admin xử lý. Lỗi: {}", orderId, e.getMessage());
        }
    }

    // =========================================================
    // CẬP NHẬT TRẠNG THÁI (Admin thủ công)
    // =========================================================
    @Caching(evict = {
            @CacheEvict(value = "order_detail", key = "#orderId"),
            @CacheEvict(value = "orders_user", allEntries = true)
    })
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

    /**
     * Admin thủ công duyệt + ship (vẫn giữ cho trường hợp autoShip bị lỗi GHN).
     */
    @Caching(evict = {
            @CacheEvict(value = "order_detail", key = "#orderId"),
            @CacheEvict(value = "orders_user", allEntries = true)
    })
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
        order.setTrackingStatus("ready_to_pick");
        order.setTrackingMessage("Đơn hàng đang chờ shipper đến lấy");

        Order savedOrder = orderRepository.save(order);
        orderProducer.sendOrderConfirmation(savedOrder.getId());
        return savedOrder;
    }

    // =========================================================
    // HỦY ĐƠN HÀNG — KHÁCH HÀNG TỰ HỦY
    // =========================================================

    /**
     * Khách hàng hủy đơn hàng của chính mình.
     *
     * Điều kiện cho phép:
     *  - Đơn thuộc về userId đang login.
     *  - Trạng thái phải là PENDING hoặc CONFIRMED.
     *  - Nếu đã SHIPPING → ném exception (FE phải chặn từ trước, BE vẫn validate).
     *
     * Luồng xử lý:
     *  1. Validate quyền + trạng thái.
     *  2. Nếu đã có trackingCode → gọi GHN Cancel API (best-effort, không throw).
     *  3. Cập nhật OrderStatus = CANCELLED, lưu cancelReason, cancelledAt.
     *  4. Hoàn trả tồn kho (releaseStock).
     *  5. Gửi email thông báo hủy đơn (qua RabbitMQ).
     *
     * @param orderId ID đơn hàng cần hủy
     * @param request chứa lý do hủy từ khách
     * @return OrderResponse sau khi cập nhật
     */
    @Caching(evict = {
            @CacheEvict(value = "order_detail", key = "#orderId"),
            @CacheEvict(value = "orders_user", key = "#result.userId")
    })
    @Transactional
    public OrderResponse cancelOrder(Long orderId, CancelOrderRequest request) {
        // Lấy thông tin người dùng đang login
        String currentUserId = resolveCurrentUserId();

        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        // 1. Kiểm tra quyền sở hữu đơn hàng
        if (order.getUserId() != null && !order.getUserId().equals(currentUserId)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        // 2. Kiểm tra trạng thái cho phép hủy
        boolean canCancel = false;
        if (order.getStatus() == OrderStatus.PENDING || order.getStatus() == OrderStatus.CONFIRMED) {
            canCancel = true;
        } else if (order.getStatus() == OrderStatus.SHIPPING) {
            String tStatus = order.getTrackingStatus();
            // Chỉ cho hủy nếu GHN chưa kịp lấy hàng (ready_to_pick) hoặc chưa đồng bộ (null)
            if (tStatus == null || "ready_to_pick".equals(tStatus)) {
                canCancel = true;
            }
        }

        if (!canCancel) {
            throw new AppException(ErrorCode.ORDER_CANNOT_CANCEL);
        }

        // 3. Nếu đơn đã đẩy sang GHN (có mã vận đơn), gọi API hủy của GHN
        if (order.getTrackingCode() != null && !order.getTrackingCode().isEmpty()) {
            try {
                // Giả định bạn có hàm ghnService.cancelOrder(trackingCode)
                 ghnService.cancelShippingOrder(order);
                log.info("Đã gửi request hủy đơn {} lên GHN", order.getTrackingCode());
            } catch (Exception e) {
                log.error("Lỗi khi hủy đơn trên GHN: {}", e.getMessage());
                // Vẫn tiếp tục hủy ở local database vì gói hàng vật lý vẫn còn trong kho
            }
        }

        // 4. Cập nhật trạng thái đơn hàng
        // NOTE: KHÔNG sửa trackingStatus — field đó do GHN Webhook quản lý
        order.setStatus(OrderStatus.CANCELLED);
        order.setCancelReason(request.getReason());
        order.setCancelledAt(LocalDateTime.now());
        orderRepository.save(order);

        // 5. Hoàn trả tồn kho
        releaseInventoryForOrder(order);

        // 6. Gửi email thông báo hủy đơn
        orderProducer.sendOrderCancelled(orderId);

        try {
            notificationProducer.sendAdminNotification(
                    "NEW_CANCEL_ORDER",
                    String.valueOf(order.getId()),
                    "Khách hàng " + order.getFullName() + " vừa hủy đơn hàng #" + order.getId() + ". Lý do: " + request.getReason()
            );
        } catch (Exception e) {
            log.error("Không thể gửi thông báo RabbitMQ cho hủy đơn {}: {}", order.getId(), e.getMessage());
        }

        log.info("[CancelOrder] ✅ Đơn hàng {} đã bị hủy bởi userId={}. Lý do: {}",
                orderId, currentUserId, request.getReason());

        return orderResponseMapper.toOrderResponse(order);
    }

    // =========================================================
    // YÊU CẦU HOÀN TRẢ — KHÁCH HÀNG
    // =========================================================

    /**
     * Khách hàng gửi yêu cầu hoàn trả/đổi hàng sau khi nhận.
     *
     * Điều kiện cho phép:
     *  - Đơn thuộc về userId đang login.
     *  - Trạng thái phải là COMPLETED (đã giao thành công).
     *  - Trong vòng RETURN_WINDOW_DAYS ngày kể từ khi tạo đơn (business rule tùy chỉnh).
     *
     * Luồng xử lý:
     *  1. Validate quyền + trạng thái.
     *  2. Cập nhật OrderStatus = RETURN_REQUESTED.
     *  3. Lưu returnReason, returnDescription, returnImages (JSON), returnRequestedAt.
     *  4. KHÔNG hoàn tồn kho ngay — Admin xét duyệt và hoàn kho thủ công khi RETURNED.
     *
     * @param orderId ID đơn hàng cần hoàn
     * @param request chứa reason, description, imageUrls
     * @return OrderResponse sau khi cập nhật
     */
    @Caching(evict = {
            @CacheEvict(value = "order_detail", key = "#orderId"),
            @CacheEvict(value = "orders_user", key = "#result.userId", allEntries = true)
    })
    @Transactional
    public OrderResponse requestReturnOrder(Long orderId, ReturnOrderRequest request) {
        String currentUserId = resolveCurrentUserId();

        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        // 1. Kiểm tra quyền sở hữu
        if (order.getUserId() != null && !order.getUserId().equals(currentUserId)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        // 2. Chỉ cho phép hoàn trả khi đơn đã COMPLETED
        if (order.getStatus() != OrderStatus.COMPLETED || !"delivered".equals(order.getTrackingStatus())) {
            throw new RuntimeException(
                    "Chỉ có thể yêu cầu hoàn trả khi đơn hàng đã được GHN giao thành công đến tay bạn.");
        }

        // 3. Kiểm tra thời hạn hoàn trả (tính từ ngày tạo đơn)
        if (order.getCreatedAt() != null) {
            LocalDateTime deadline = order.getCreatedAt().plusDays(RETURN_WINDOW_DAYS);
            if (LocalDateTime.now().isAfter(deadline)) {
                throw new RuntimeException(
                        "Đã quá " + RETURN_WINDOW_DAYS + " ngày kể từ ngày đặt hàng, không thể yêu cầu hoàn trả.");
            }
        }

        // 4. Serialize imageUrls → JSON để lưu vào TEXT column
        String imagesJson = serializeImageUrls(request.getImageUrls());

        // 5. Cập nhật thông tin hoàn trả
        order.setStatus(OrderStatus.RETURN_REQUESTED);
        order.setReturnReason(request.getReason());
        order.setReturnDescription(request.getDescription());
        order.setReturnImages(imagesJson);
        order.setReturnRequestedAt(LocalDateTime.now());
        orderRepository.save(order);

        try {
            notificationProducer.sendAdminNotification(
                    "NEW_RETURN_REQUEST",
                    String.valueOf(order.getId()),
                    "Khách hàng " + order.getFullName() + " vừa gửi yêu cầu hoàn trả cho đơn #" + order.getId() + ". Cần Admin xét duyệt."
            );
        } catch (Exception e) {
            log.error("Không thể gửi thông báo RabbitMQ cho hoàn trả đơn {}: {}", order.getId(), e.getMessage());
        }

        log.info("[ReturnOrder] ✅ Yêu cầu hoàn trả đơn hàng {} từ userId={}. Lý do: {}",
                orderId, currentUserId, request.getReason());

        return orderResponseMapper.toOrderResponse(order);
    }

    @Caching(evict = {
            @CacheEvict(value = "order_detail", key = "#orderId"),
            @CacheEvict(value = "orders_user", key = "#result.userId", allEntries = true)
    })
    @Transactional
    public OrderResponse approveReturnOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        // Chỉ cho phép duyệt nếu đơn đang ở trạng thái Yêu cầu hoàn trả
        if (order.getStatus() != OrderStatus.RETURN_REQUESTED) {
            throw new RuntimeException("Chỉ có thể duyệt các đơn đang ở trạng thái Yêu cầu hoàn trả.");
        }

        // Chuyển sang trạng thái Đã hoàn trả
        order.setStatus(OrderStatus.RETURNED);

        releaseInventoryForOrder(order);

        Order savedOrder = orderRepository.save(order);
        return orderResponseMapper.toOrderResponse(savedOrder);
    }

    // =========================================================
    // PRIVATE HELPERS
    // =========================================================

    /**
     * Giải phóng tồn kho cho tất cả OrderItem (dùng khi đơn bị hủy).
     */
    private void releaseInventoryForOrder(Order order) {
        List<OrderItem> items = order.getOrderItems();
        if (items == null || items.isEmpty()) return;

        for (OrderItem item : items) {
            try {
                skuRepository.findById(item.getSkuId()).ifPresent(sku -> {
                    sku.setStockQuantity(sku.getStockQuantity() + item.getQuantity());
                    skuRepository.save(sku);
                });
                inventoryService.releaseStock(item.getSkuId(), item.getQuantity());
            } catch (Exception e) {
                log.error("[ReleaseInventory] Lỗi hoàn kho skuId={}, qty={}: {}",
                        item.getSkuId(), item.getQuantity(), e.getMessage());
            }
        }
    }

    /**
     * Xuất kho thực tế cho tất cả OrderItem (dùng khi đơn hoàn thành).
     */
    private void deductInventoryForOrder(Order order) {
        List<OrderItem> items = order.getOrderItems();
        if (items == null || items.isEmpty()) return;

        for (OrderItem item : items) {
            try {
                inventoryService.deductStock(item.getSkuId(), item.getQuantity());
            } catch (Exception e) {
                log.error("[DeductInventory] Lỗi xuất kho skuId={}, qty={}: {}",
                        item.getSkuId(), item.getQuantity(), e.getMessage());
            }
        }
    }

    /**
     * Lấy userId của người dùng đang đăng nhập qua SecurityContext.
     */
    private String resolveCurrentUserId() {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            return userRepository.findByUsername(username)
                    .map(User::getId)
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
    }

    /**
     * Serialize List<String> thành JSON array string.
     */
    private String serializeImageUrls(List<String> urls) {
        if (urls == null || urls.isEmpty()) return "[]";
        try {
            return objectMapper.writeValueAsString(urls);
        } catch (JsonProcessingException e) {
            log.error("Lỗi serialize imageUrls: {}", e.getMessage());
            return "[]";
        }
    }
}