package com.example.clothingstore.service.impl;

import com.example.clothingstore.dtos.order.request.CheckoutRequest;
import com.example.clothingstore.dtos.order.response.CheckoutResponse;
import com.example.clothingstore.dtos.order.response.CheckoutResponse.StockMismatch;
import com.example.clothingstore.entity.*;
import com.example.clothingstore.entity.Enum.OrderStatus;
import com.example.clothingstore.exception.StockException;
import com.example.clothingstore.repository.*;
import com.example.clothingstore.service.CartService;
import com.example.clothingstore.service.rabbitmq.OrderProducer;
import jakarta.persistence.OptimisticLockException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
 * Luồng mới:
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
    private final OrderProducer         orderProducer;
    private final OrderService          orderService; // Dùng để gọi autoConfirmAndShip

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
            return executeCheckoutWithRetry(request, userId);
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
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public CheckoutResponse executeCheckoutWithRetry(CheckoutRequest request, String userId) {

        List<Long> skuIds = request.getItems().stream()
                .map(CheckoutRequest.CheckoutItem::getSkuId)
                .collect(Collectors.toList());

        Map<Long, Inventory> inventoryMap = inventoryRepository.findBySkuIdIn(skuIds).stream()
                .collect(Collectors.toMap(i -> i.getSku().getId(), i -> i));

        // Final stock check trong transaction
        List<StockException.StockIssue> issues = new ArrayList<>();
        for (CheckoutRequest.CheckoutItem item : request.getItems()) {
            Inventory inv = inventoryMap.get(item.getSkuId());
            if (inv == null || inv.getAvailableQuantity() < item.getQuantity()) {
                int available = inv == null ? 0 : inv.getAvailableQuantity();
                issues.add(new StockException.StockIssue(
                        item.getSkuId(), item.getProductName(), item.getQuantity(), available));
            }
        }
        if (!issues.isEmpty()) {
            boolean allOut = issues.stream().allMatch(i -> i.getAvailable() == 0);
            throw new StockException(
                    allOut ? StockException.Type.OUT_OF_STOCK : StockException.Type.PARTIAL_AVAILABLE,
                    issues);
        }

        // Deduct stock (trigger optimistic lock)
        for (CheckoutRequest.CheckoutItem item : request.getItems()) {
            Inventory inv = inventoryMap.get(item.getSkuId());
            inv.setAvailableQuantity(inv.getAvailableQuantity() - item.getQuantity());
            inv.setReservedQuantity(inv.getReservedQuantity() + item.getQuantity());
            inventoryRepository.save(inv);
        }

        // Tạo Order
        User user = userRepository.findByUsername(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        BigDecimal subtotal = request.getItems().stream()
                .map(i -> i.getPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

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
                .totalAmount(subtotal.add(request.getShippingFee()))
                .discountAmount(BigDecimal.ZERO)
                .paymentMethod(request.getPaymentMethod())
                .status(OrderStatus.PENDING)
                .build();

        Order savedOrder = orderRepository.save(order);

        List<OrderItem> orderItems = request.getItems().stream().map(item -> {
            Inventory inv = inventoryMap.get(item.getSkuId());
            String productName = (inv != null && inv.getSku() != null && inv.getSku().getProduct() != null)
                    ? inv.getSku().getProduct().getName()
                    : item.getProductName();
            return OrderItem.builder()
                    .order(savedOrder).skuId(item.getSkuId())
                    .productName(productName).quantity(item.getQuantity())
                    .priceAtPurchase(item.getPrice()).build();
        }).collect(Collectors.toList());

        orderItemRepository.saveAll(orderItems);

        savedOrder.setOrderItems(orderItems);

        cartService.clearCart(user.getId());

        log.info("✅ Checkout thành công: orderId={}, userId={}, method={}",
                savedOrder.getId(), user.getId(), request.getPaymentMethod());

        // -------------------------------------------------------
        // AUTO-SHIP:
        //   COD    → xác nhận + ship ngay
        //   VNPAY  → chờ callback từ VNPay, PaymentController gọi autoConfirmAndShip
        // -------------------------------------------------------
        if ("COD".equals(request.getPaymentMethod())) {
            // Gọi async-safe: dùng transaction mới để không bị rollback cùng checkout
            orderService.autoConfirmAndShip(savedOrder.getId());
        }

        return CheckoutResponse.builder()
                .status(CheckoutResponse.Status.SUCCESS)
                .orderId(savedOrder.getId())
                .totalAmount(savedOrder.getTotalAmount())
                .message("Đặt hàng thành công!")
                .build();
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
        return issues.stream().map(i -> StockMismatch.builder()
                .skuId(i.getSkuId()).productName(i.getProductName())
                .requestedQuantity(i.getRequested()).availableQuantity(i.getAvailable())
                .canPartialFulfill(i.getAvailable() > 0)
                .userMessage(i.getAvailable() == 0
                        ? "\"" + i.getProductName() + "\" đã hết hàng"
                        : "\"" + i.getProductName() + "\" hiện chỉ còn " + i.getAvailable() + " sản phẩm")
                .build()).collect(Collectors.toList());
    }
}