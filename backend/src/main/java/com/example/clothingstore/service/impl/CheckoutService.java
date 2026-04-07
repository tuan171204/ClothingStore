package com.example.clothingstore.service.impl;

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
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CheckoutService {

    private final OrderRepository       orderRepository;
    private final OrderItemRepository   orderItemRepository;
    private final UserRepository        userRepository;
    private final SkuRepository         skuRepository;
    private final InventoryRepository   inventoryRepository;
        private final CouponsRepository     couponsRepository;
    private final CartService           cartService;
    private final OrderProducer         orderProducer;

    private static final int MAX_RETRY = 3;

    /**
     * MAIN CHECKOUT — Entry point.
     * Tách validation ra ngoài @Transactional để có thể trả về
     * PARTIAL_AVAILABLE response mà không rollback.
     */
    public CheckoutResponse checkout(CheckoutRequest request) {
        String userId = resolveUserId();

        // === BƯỚC 1: Pre-validation (không lock, không transaction) ===
        // Đọc nhanh để fail-fast trước khi vào critical section
        List<StockMismatch> mismatches = preValidateStock(request.getItems());
        if (!mismatches.isEmpty()) {
            boolean allOutOfStock = mismatches.stream()
                    .allMatch(m -> m.getAvailableQuantity() == 0);

            return CheckoutResponse.builder()
                    .status(allOutOfStock
                            ? CheckoutResponse.Status.OUT_OF_STOCK
                            : CheckoutResponse.Status.PARTIAL_AVAILABLE)
                    .message(buildMismatchMessage(mismatches))
                    .stockMismatches(mismatches)
                    .build();
        }

        // === BƯỚC 2: Atomic checkout với retry ===
        try {
            return executeCheckoutWithRetry(request, userId);
        } catch (StockException e) {
            // Stock hết sau khi đã vào transaction (race condition)
            return CheckoutResponse.builder()
                    .status(e.getType() == StockException.Type.OUT_OF_STOCK
                            ? CheckoutResponse.Status.OUT_OF_STOCK
                            : CheckoutResponse.Status.PARTIAL_AVAILABLE)
                    .message(e.getMessage())
                    .stockMismatches(toMismatchDtos(e.getIssues()))
                    .build();
        }
    }

    public CheckoutResponse previewCheckout(CheckoutRequest request) {
        List<CheckoutRequest.CheckoutItem> items = request.getItems() == null
                ? Collections.emptyList()
                : request.getItems();

        BigDecimal shippingFee = request.getShippingFee() == null ? BigDecimal.ZERO : request.getShippingFee();

        BigDecimal subtotal = items.stream()
                .map(i -> i.getPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal discountAmount = BigDecimal.ZERO;
        String appliedCouponCode = null;

        String normalizedCouponCode = request.getCouponCode() == null
                ? null
                : request.getCouponCode().trim().toUpperCase();

        if (normalizedCouponCode != null && !normalizedCouponCode.isEmpty()) {
            Coupon coupon = couponsRepository.findByCode(normalizedCouponCode)
                    .orElseThrow(() -> new AppException(ErrorCode.COUPON_NOT_FOUND));

            Map<Long, Inventory> inventoryMap = getInventoryMap(items);
            discountAmount = calculateDiscount(coupon, items, inventoryMap, subtotal);
            appliedCouponCode = coupon.getCode();
        }

        BigDecimal totalAmount = subtotal.add(shippingFee).subtract(discountAmount).max(BigDecimal.ZERO);

        return CheckoutResponse.builder()
                .status(CheckoutResponse.Status.SUCCESS)
                .message("Tính toán khuyến mãi thành công")
                .totalAmount(totalAmount)
                .discountAmount(discountAmount)
                .appliedCouponCode(appliedCouponCode)
                .build();
    }

    /**
     * CRITICAL SECTION — Optimistic Lock với retry.
     *
     * Spring @Retryable tự động retry khi ObjectOptimisticLockingFailureException.
     * Mỗi lần retry: 50ms, 100ms, 200ms (exponential backoff).
     *
     * SQL behavior (PostgreSQL/MySQL):
     *   UPDATE inventory
     *   SET available_quantity = available_quantity - ?,
     *       reserved_quantity = reserved_quantity + ?,
     *       version = version + 1
     *   WHERE sku_id = ? AND version = ?  ← Optimistic lock check
     *
     * Nếu version không khớp → 0 rows updated → JPA throw OptimisticLockException
     */
    @Retryable(
            retryFor  = {ObjectOptimisticLockingFailureException.class,
                    OptimisticLockException.class},
            maxAttempts = MAX_RETRY,
            backoff   = @Backoff(delay = 50, multiplier = 2, random = true)
    )
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public CheckoutResponse executeCheckoutWithRetry(CheckoutRequest request, String userId) {

        List<Long> skuIds = request.getItems().stream()
                .map(CheckoutRequest.CheckoutItem::getSkuId)
                .collect(Collectors.toList());

        // === BƯỚC 2.1: Load tất cả inventory trong 1 query (tránh N+1) ===
        // QUAN TRỌNG: Sort by sku_id để tránh deadlock khi có nhiều transaction
        Map<Long, Inventory> inventoryMap = getInventoryMap(request.getItems());

        // === BƯỚC 2.2: Final stock validation trong transaction ===
        List<StockException.StockIssue> issues = new ArrayList<>();
        for (CheckoutRequest.CheckoutItem item : request.getItems()) {
            Inventory inv = inventoryMap.get(item.getSkuId());
            if (inv == null || inv.getAvailableQuantity() < item.getQuantity()) {
                int available = inv == null ? 0 : inv.getAvailableQuantity();
                issues.add(new StockException.StockIssue(
                        item.getSkuId(), item.getProductName(),
                        item.getQuantity(), available));
            }
        }

        if (!issues.isEmpty()) {
            // Tìm loại lỗi: nếu tất cả available = 0 → OUT_OF_STOCK,
            // còn 1 số có hàng nhưng ít hơn yêu cầu → PARTIAL_AVAILABLE
            boolean allOut = issues.stream().allMatch(i -> i.getAvailable() == 0);
            throw new StockException(
                    allOut ? StockException.Type.OUT_OF_STOCK
                            : StockException.Type.PARTIAL_AVAILABLE,
                    issues);
        }

        // === BƯỚC 2.3: Deduct stock (trigger optimistic lock) ===
        for (CheckoutRequest.CheckoutItem item : request.getItems()) {
            Inventory inv = inventoryMap.get(item.getSkuId());
            inv.setAvailableQuantity(inv.getAvailableQuantity() - item.getQuantity());
            inv.setReservedQuantity(inv.getReservedQuantity() + item.getQuantity());
            inventoryRepository.save(inv); // ← JPA check version ở đây
        }

        // === BƯỚC 2.4: Tạo Order ===
        User user = userRepository.findByUsername(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        BigDecimal subtotal = request.getItems().stream()
                .map(i -> i.getPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Coupon appliedCoupon = null;
        BigDecimal discountAmount = BigDecimal.ZERO;
        String normalizedCouponCode = request.getCouponCode() == null
                ? null
                : request.getCouponCode().trim().toUpperCase();

        if (normalizedCouponCode != null && !normalizedCouponCode.isEmpty()) {
            appliedCoupon = couponsRepository.findByCode(normalizedCouponCode)
                    .orElseThrow(() -> new AppException(ErrorCode.COUPON_NOT_FOUND));
            discountAmount = calculateDiscount(appliedCoupon, request.getItems(), inventoryMap, subtotal);
        }

        BigDecimal totalAmount = subtotal
                .add(request.getShippingFee())
                .subtract(discountAmount)
                .max(BigDecimal.ZERO);

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
                .totalAmount(totalAmount)
                .discountAmount(discountAmount)
                .paymentMethod(request.getPaymentMethod())
                .status(OrderStatus.PENDING)
                .build();

        Order savedOrder = orderRepository.save(order);

        List<OrderItem> orderItems = request.getItems().stream()
                .map(item -> {
                    // Lấy trực tiếp thông tin chuẩn từ DB đã query ở Bước 2.1
                    Inventory inv = inventoryMap.get(item.getSkuId());

                    String realProductName = (inv != null && inv.getSku() != null && inv.getSku().getProduct() != null)
                            ? inv.getSku().getProduct().getName()
                            : item.getProductName(); // Fallback nhẹ nếu có lỗi relation

                    return OrderItem.builder()
                            .order(savedOrder)
                            .skuId(item.getSkuId())
                            .productName(realProductName)
                            .quantity(item.getQuantity())
                            .priceAtPurchase(item.getPrice())
                            .build();
                })
                .collect(Collectors.toList());

        orderItemRepository.saveAll(orderItems);

                if (appliedCoupon != null) {
                        appliedCoupon.setUsedCount((appliedCoupon.getUsedCount() == null ? 0 : appliedCoupon.getUsedCount()) + 1);
                        couponsRepository.save(appliedCoupon);
                }

        // === BƯỚC 2.5: Clear cart ===
        cartService.clearCart(user.getId());

        // === BƯỚC 2.6: Gửi email async ===
        if ("COD".equals(request.getPaymentMethod())) {
            orderProducer.sendOrderConfirmation(savedOrder.getId());
        }

        log.info("✅ Checkout thành công: orderId={}, userId={}", savedOrder.getId(), user.getId());

        return CheckoutResponse.builder()
                .status(CheckoutResponse.Status.SUCCESS)
                .orderId(savedOrder.getId())
                .totalAmount(savedOrder.getTotalAmount())
                                .discountAmount(savedOrder.getDiscountAmount())
                                .appliedCouponCode(appliedCoupon != null ? appliedCoupon.getCode() : null)
                .message("Đặt hàng thành công!")
                .build();
    }

        private BigDecimal calculateDiscount(
                        Coupon coupon,
                        List<CheckoutRequest.CheckoutItem> items,
                        Map<Long, Inventory> inventoryMap,
                        BigDecimal subtotal
        ) {
                LocalDateTime now = LocalDateTime.now();

                if (!coupon.isActive()) {
                        throw new AppException(ErrorCode.INVALID_DATA);
                }
                if (coupon.getStartDate() != null && now.isBefore(coupon.getStartDate())) {
                        throw new AppException(ErrorCode.INVALID_DATA);
                }
                if (coupon.getEndDate() != null && now.isAfter(coupon.getEndDate())) {
                        throw new AppException(ErrorCode.INVALID_DATA);
                }
                if (coupon.getUsageLimit() != null && (coupon.getUsedCount() == null ? 0 : coupon.getUsedCount()) >= coupon.getUsageLimit()) {
                        throw new AppException(ErrorCode.INVALID_DATA);
                }
                if (coupon.getMinOrderValue() != null && subtotal.compareTo(coupon.getMinOrderValue()) < 0) {
                        throw new AppException(ErrorCode.INVALID_DATA);
                }

                BigDecimal eligibleAmount = subtotal;
                if (coupon.getApplyType() == ApplyType.PRODUCT) {
                        Set<Long> productIds = coupon.getProducts() == null
                                        ? Collections.emptySet()
                                        : coupon.getProducts().stream().map(Product::getId).collect(Collectors.toSet());

                        eligibleAmount = items.stream()
                                        .filter(item -> {
                                                Inventory inv = inventoryMap.get(item.getSkuId());
                                                Long productId = inv != null && inv.getSku() != null && inv.getSku().getProduct() != null
                                                                ? inv.getSku().getProduct().getId()
                                                                : null;
                                                return productId != null && productIds.contains(productId);
                                        })
                                        .map(i -> i.getPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                }

                if (eligibleAmount.compareTo(BigDecimal.ZERO) <= 0) {
                        throw new AppException(ErrorCode.COUPON_NOT_ELIGIBLE);
                }

                BigDecimal discount;
                if (coupon.getDiscountType() == DiscountType.PERCENTAGE) {
                        discount = eligibleAmount
                                        .multiply(coupon.getDiscountValue())
                                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

                        if (coupon.getMaxDiscountAmount() != null && coupon.getMaxDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
                                discount = discount.min(coupon.getMaxDiscountAmount());
                        }
                } else {
                        discount = coupon.getDiscountValue();
                }

                return discount.max(BigDecimal.ZERO).min(subtotal);
        }

    /**
     * Pre-validation: đọc nhanh không lock, chỉ để fail-fast trước khi vào transaction.
     * Không phải "final check" — final check thực sự là trong executeCheckoutWithRetry.
     */
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
                String variant = buildVariantName(sku);

                mismatches.add(StockMismatch.builder()
                        .skuId(item.getSkuId())
                        .productName(item.getProductName())
                        .variantName(variant)
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

        private Map<Long, Inventory> getInventoryMap(List<CheckoutRequest.CheckoutItem> items) {
                List<Long> skuIds = items == null
                                ? Collections.emptyList()
                                : items.stream().map(CheckoutRequest.CheckoutItem::getSkuId).collect(Collectors.toList());

                if (skuIds.isEmpty()) {
                        return Collections.emptyMap();
                }

                return inventoryRepository.findBySkuIdIn(skuIds).stream()
                                .collect(Collectors.toMap(i -> i.getSku().getId(), i -> i));
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
        return mismatches.stream()
                .map(StockMismatch::getUserMessage)
                .collect(Collectors.joining(". "));
    }

    private List<StockMismatch> toMismatchDtos(List<StockException.StockIssue> issues) {
        return issues.stream()
                .map(i -> StockMismatch.builder()
                        .skuId(i.getSkuId())
                        .productName(i.getProductName())
                        .requestedQuantity(i.getRequested())
                        .availableQuantity(i.getAvailable())
                        .canPartialFulfill(i.getAvailable() > 0)
                        .userMessage(i.getAvailable() == 0
                                ? "\"" + i.getProductName() + "\" đã hết hàng"
                                : "\"" + i.getProductName() + "\" hiện chỉ còn " + i.getAvailable() + " sản phẩm")
                        .build())
                .collect(Collectors.toList());
    }
}