package com.example.clothingstore.service.impl;

import com.example.clothingstore.config.RabbitMQConfig;
import com.example.clothingstore.dtos.coupon.request.ApplyCouponRequest;
import com.example.clothingstore.dtos.coupon.response.ApplyCouponResponse;
import com.example.clothingstore.dtos.event.FlashSaleSyncMessage;
import com.example.clothingstore.dtos.order.request.CheckoutRequest;
import com.example.clothingstore.dtos.order.response.CheckoutResponse;
import com.example.clothingstore.dtos.order.response.CheckoutResponse.StockMismatch;
import com.example.clothingstore.entity.*;
import com.example.clothingstore.entity.Enum.OrderStatus;
import com.example.clothingstore.exception.AppException;
import com.example.clothingstore.exception.ErrorCode;
import com.example.clothingstore.exception.StockException;
import com.example.clothingstore.repository.*;
import com.example.clothingstore.service.CartService;
import com.example.clothingstore.service.CouponsService;
import com.example.clothingstore.service.rabbitmq.FlashSaleConsumer;
import com.example.clothingstore.service.rabbitmq.NotificationProducer;
import com.example.clothingstore.service.rabbitmq.OrderProducer;
import jakarta.persistence.OptimisticLockException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.context.annotation.Lazy;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Luồng:
 *   Checkout thành công → Tạo Order (PENDING)
 *                       → Gọi OrderService.autoConfirmAndShip() NGAY LẬP TỨC
 *                       → PENDING → CONFIRMED → SHIPPING (nếu GHN thành công)
 *
 * Với VNPAY: autoConfirmAndShip được gọi từ PaymentController sau khi verify callback.
 * Với COD  : autoConfirmAndShip được gọi ngay trong executeCheckoutWithRetry.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CheckoutService {

    private final OrderRepository       orderRepository;
    private final OrderItemRepository   orderItemRepository;
    private final UserRepository        userRepository;
    private final SkuRepository         skuRepository;
    private final InventoryRepository   inventoryRepository;
    private final CartService           cartService;
    private final OrderService          orderService; // Dùng để gọi autoConfirmAndShip
    private final NotificationProducer notificationProducer;
    private final CouponsService couponsService;
    private final FlashSaleRedisService flashSaleRedisService;
    private final RabbitTemplate rabbitTemplate;

    @Autowired
    @Lazy
    private CheckoutService self;

    private static final int MAX_RETRY = 3;

    // ----------------------------------------------------------------
    // Main entry point
    // ----------------------------------------------------------------

    public CheckoutResponse checkout(CheckoutRequest request) {
        String userId = resolveUserId();

        List<StockMismatch> mismatches = preValidateStock(request.getItems());
        if (!mismatches.isEmpty()) {
            boolean allOut = mismatches.stream().allMatch(m -> m.getAvailableQuantity() == 0);
            return CheckoutResponse.builder()
                    .status(allOut ? CheckoutResponse.Status.OUT_OF_STOCK
                            : CheckoutResponse.Status.PARTIAL_AVAILABLE)
                    .message(buildMismatchMessage(mismatches))
                    .stockMismatches(mismatches)
                    .build();
        }

        try {
            return self.executeCheckoutWithRetry(request, userId);
        } catch (StockException e) {
            return CheckoutResponse.builder()
                    .status(e.getType() == StockException.Type.OUT_OF_STOCK
                            ? CheckoutResponse.Status.OUT_OF_STOCK
                            : CheckoutResponse.Status.PARTIAL_AVAILABLE)
                    .message(e.getMessage())
                    .stockMismatches(toMismatchDtos(e.getIssues()))
                    .build();
        }
    }

    // ----------------------------------------------------------------
    // Critical section với Optimistic Lock + Retry
    // ----------------------------------------------------------------
    @Retryable(
            retryFor  = {ObjectOptimisticLockingFailureException.class, OptimisticLockException.class},
            maxAttempts = MAX_RETRY,
            backoff   = @Backoff(delay = 50, multiplier = 2, random = true)
    )
    @CacheEvict(value = "orders_user", key = "#userId")
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public CheckoutResponse executeCheckoutWithRetry(CheckoutRequest request, String userId) {

        List<Long> skuIds = request.getItems().stream()
                .map(CheckoutRequest.CheckoutItem::getSkuId)
                .collect(Collectors.toList());

        Map<Long, Inventory> inventoryMap = inventoryRepository.findBySkuIdIn(skuIds).stream()
                .collect(Collectors.toMap(i -> i.getSku().getId(), i -> i));

        List<FlashSaleSyncMessage> syncMessages = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        List<StockException.StockIssue> issues = new ArrayList<>();

        try {
            // 1. VÒNG LẶP DUY NHẤT: Vừa kiểm tra, vừa trừ kho, vừa tính tiền
            for (CheckoutRequest.CheckoutItem item : request.getItems()) {
                var fsResult = flashSaleRedisService.checkAndDeductFlashSale(item.getSkuId(), item.getQuantity());

                if (fsResult != null) {
                    BigDecimal itemTotal = fsResult.promotionalPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
                    subtotal = subtotal.add(itemTotal);
                    item.setPrice(fsResult.promotionalPrice());
                    syncMessages.add(new FlashSaleSyncMessage(fsResult.flashSaleId(), item.getSkuId(), item.getQuantity()));
                } else {
                    Inventory inv = inventoryMap.get(item.getSkuId());

                    // [FIX RACE CONDITION] Reload inventory với lock để lấy số liệu mới nhất
                    // Tránh đọc dữ liệu cũ từ batch load trước đó khi có concurrent checkout
                    if (inv != null) {
                        inv = inventoryRepository.findBySkuIdWithLock(item.getSkuId())
                                .orElse(inv);
                    }

                    int available = inv != null ? inv.getAvailableQuantity() : 0;

                    if (inv == null || available < item.getQuantity()) {
                        // [FIX] Phân biệt rõ 2 trường hợp:
                        // - available == 0: Hết hàng hoàn toàn (race condition: người khác vừa mua hết)
                        // - available > 0 nhưng < requested: Không đủ số lượng
                        String raceMessage;
                        if (available == 0) {
                            raceMessage = "\"" + item.getProductName() + "\" vừa hết hàng " +
                                    "(có người khác vừa đặt mua thành công). Vui lòng xóa sản phẩm này khỏi giỏ hàng.";
                        } else {
                            raceMessage = "\"" + item.getProductName() + "\" hiện chỉ còn " + available +
                                    " sản phẩm (số lượng vừa thay đổi do đơn hàng khác). Vui lòng điều chỉnh số lượng.";
                        }
                        issues.add(new StockException.StockIssue(
                                item.getSkuId(), item.getProductName(),
                                item.getQuantity(), available, raceMessage));
                        continue;
                    }

                    inv.setAvailableQuantity(available - item.getQuantity());
                    inv.setReservedQuantity(inv.getReservedQuantity() + item.getQuantity());
                    inventoryRepository.save(inv);

                    subtotal = subtotal.add(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
                }
            }

            if (!issues.isEmpty()) {
                boolean allOut = issues.stream().allMatch(i -> i.getAvailable() == 0);
                throw new StockException(
                        allOut ? StockException.Type.OUT_OF_STOCK : StockException.Type.PARTIAL_AVAILABLE,
                        issues);
            }

            User user = userRepository.findByUsername(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            BigDecimal discountAmount = BigDecimal.ZERO;

            if (request.getCouponCode() != null && !request.getCouponCode().trim().isEmpty()) {
                ApplyCouponRequest applyReq = new ApplyCouponRequest();
                applyReq.setCode(request.getCouponCode());
                applyReq.setOrderTotal(subtotal);

                List<ApplyCouponRequest.CartItemRef> cartItemRefs = request.getItems().stream().map(item -> {
                    ApplyCouponRequest.CartItemRef ref = new ApplyCouponRequest.CartItemRef();
                    Inventory inv = inventoryMap.get(item.getSkuId());
                    ref.setSkuId(item.getSkuId());
                    ref.setProductId(inv.getSku().getProduct().getId());
                    ref.setQuantity(item.getQuantity());
                    ref.setPrice(item.getPrice());
                    return ref;
                }).collect(Collectors.toList());
                applyReq.setCartItems(cartItemRefs);

                ApplyCouponResponse couponResp = couponsService.applyCoupon(applyReq);

                if (!couponResp.isValid()) {
                    throw new AppException(ErrorCode.COUPON_CODE_OUT_OF_STOCK);
                }

                discountAmount = couponResp.getDiscountAmount();
                couponsService.markCouponUsed(request.getCouponCode());
            }

            BigDecimal finalTotal = subtotal.subtract(discountAmount).add(request.getShippingFee());

            Order order = Order.builder()
                    .userId(user.getId())
                    .fullName(request.getFullName())
                    .phoneNumber(request.getPhoneNumber())
                    .shippingAddress(request.getAddress())
                    .toProvinceId(request.getToProvinceId())
                    .toDistrictId(request.getToDistrictId())
                    .toWardCode(request.getToWardCode())
                    .note(request.getNote())
                    .shippingFee(request.getShippingFee())
                    .subtotal(subtotal)
                    .totalAmount(finalTotal)
                    .couponCode(request.getCouponCode() != null && !request.getCouponCode().isBlank()
                            ? request.getCouponCode().trim().toUpperCase() : null)
                    .discountAmount(discountAmount)
                    .paymentMethod(request.getPaymentMethod())
                    .status(OrderStatus.PENDING)
                    .build();

            Order savedOrder = orderRepository.save(order);

            List<OrderItem> orderItems = request.getItems().stream().map(item -> {
                Inventory inv = inventoryMap.get(item.getSkuId());

                String baseProductName = (inv != null && inv.getSku() != null && inv.getSku().getProduct() != null)
                        ? inv.getSku().getProduct().getName() : item.getProductName();

                String variantName = (inv != null && inv.getSku() != null) ? buildVariantName(inv.getSku()) : "";

                String finalProductName = variantName.isEmpty() ? baseProductName : baseProductName + " (" + variantName + ")";

                return OrderItem.builder()
                        .order(savedOrder)
                        .skuId(item.getSkuId())
                        .productName(finalProductName)
                        .quantity(item.getQuantity())
                        .priceAtPurchase(item.getPrice())
                        .build();
            }).collect(Collectors.toList());

            orderItemRepository.saveAll(orderItems);
            savedOrder.setOrderItems(orderItems);

            for (FlashSaleSyncMessage msg : syncMessages) {
                rabbitTemplate.convertAndSend(RabbitMQConfig.FS_SYNC_EXCHANGE, RabbitMQConfig.FS_SYNC_ROUTING_KEY, msg);
            }

            log.info("✅ Checkout thành công: orderId={}, userId={}, method={}",
                    savedOrder.getId(), user.getId(), request.getPaymentMethod());

            try {
                notificationProducer.sendAdminNotification(
                        "NEW_ORDER", String.valueOf(savedOrder.getId()),
                        "Khách hàng " + savedOrder.getFullName() + " vừa đặt đơn hàng mới #" + savedOrder.getId() + " với tổng tiền " + savedOrder.getTotalAmount() + "đ."
                );
            } catch (Exception e) {
                log.error("Không thể gửi thông báo cho đơn hàng {}: {}", savedOrder.getId(), e.getMessage());
            }

            if ("COD".equals(request.getPaymentMethod())) {
                orderService.autoConfirmAndShip(savedOrder.getId());
            }
            cartService.clearCart(user.getId());

            return CheckoutResponse.builder()
                    .status(CheckoutResponse.Status.SUCCESS)
                    .orderId(savedOrder.getId())
                    .totalAmount(savedOrder.getTotalAmount())
                    .message("Đặt hàng thành công!")
                    .build();

        } catch (Exception e) {
            for (FlashSaleSyncMessage msg : syncMessages) {
                flashSaleRedisService.revertFlashSaleStock(msg.getFlashSaleId(), msg.getSkuId(), msg.getQuantity());
                log.warn("🔄 Reverted Redis FlashSaleStock for SKU: {}", msg.getSkuId());
            }
            throw e;
        }
    }

    // ----------------------------------------------------------------
    // Helpers
    // ----------------------------------------------------------------

    private List<StockMismatch> preValidateStock(List<CheckoutRequest.CheckoutItem> items) {
        List<Long> skuIds = items.stream()
                .map(CheckoutRequest.CheckoutItem::getSkuId)
                .collect(Collectors.toList());

        Map<Long, Inventory> invMap = inventoryRepository.findBySkuIdIn(skuIds).stream()
                .collect(Collectors.toMap(i -> i.getSku().getId(), i -> i));

        Map<Long, Sku> skuMap = skuRepository.findAllById(skuIds).stream()
                .collect(Collectors.toMap(Sku::getId, s -> s));

        List<StockMismatch> mismatches = new ArrayList<>();
        for (CheckoutRequest.CheckoutItem item : items) {
            Inventory inv = invMap.get(item.getSkuId());
            int available = inv != null ? inv.getAvailableQuantity() : 0;
            if (available < item.getQuantity()) {
                Sku sku = skuMap.get(item.getSkuId());
                mismatches.add(StockMismatch.builder()
                        .skuId(item.getSkuId())
                        .productName(item.getProductName())
                        .variantName(buildVariantName(sku))
                        .requestedQuantity(item.getQuantity())
                        .availableQuantity(available)
                        .canPartialFulfill(available > 0)
                        .userMessage(available == 0
                                ? "\"" + item.getProductName() + "\" đã hết hàng"
                                : "\"" + item.getProductName() + "\" hiện chỉ còn " + available + " sản phẩm")
                        .build());
            }
        }
        return mismatches;
    }

    private String resolveUserId() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    private String buildVariantName(Sku sku) {
        if (sku == null || sku.getValues() == null || sku.getValues().isEmpty()) return "";
        return sku.getValues().stream()
                .map(v -> v.getOptionValue().getValue())
                .collect(Collectors.joining(" - "));
    }

    private String buildMismatchMessage(List<StockMismatch> mismatches) {
        return mismatches.stream().map(StockMismatch::getUserMessage).collect(Collectors.joining(". "));
    }

    private List<StockMismatch> toMismatchDtos(List<StockException.StockIssue> issues) {
        return issues.stream().map(i -> {
            String userMessage = i.getRaceMessage() != null
                    ? i.getRaceMessage()
                    : (i.getAvailable() == 0
                    ? "\"" + i.getProductName() + "\" đã hết hàng"
                    : "\"" + i.getProductName() + "\" hiện chỉ còn " + i.getAvailable() + " sản phẩm");

            return StockMismatch.builder()
                    .skuId(i.getSkuId())
                    .productName(i.getProductName())
                    .requestedQuantity(i.getRequested())
                    .availableQuantity(i.getAvailable())
                    .canPartialFulfill(i.getAvailable() > 0)
                    .userMessage(userMessage)
                    .build();
        }).collect(Collectors.toList());
    }
}