package com.example.clothingstore.service.impl;

import com.example.clothingstore.dtos.PagedResponse;
import com.example.clothingstore.dtos.coupon.request.ApplyCouponRequest;
import com.example.clothingstore.dtos.coupon.request.CouponRequest;
import com.example.clothingstore.dtos.coupon.response.ApplyCouponResponse;
import com.example.clothingstore.dtos.coupon.response.CouponResponse;
import com.example.clothingstore.entity.Coupon;
import com.example.clothingstore.entity.Enum.ApplyType;
import com.example.clothingstore.entity.Enum.DiscountType;
import com.example.clothingstore.entity.Product;
import com.example.clothingstore.exception.AppException;
import com.example.clothingstore.exception.ErrorCode;
import com.example.clothingstore.repository.CouponsRepository;
import com.example.clothingstore.repository.ProductRepository;
import com.example.clothingstore.service.CouponsService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CouponsServiceImpl implements CouponsService {

    private final CouponsRepository couponsRepository;
    private final ProductRepository productRepository;

    @Override
    public List<CouponResponse> getAllCoupons(ApplyType applyType, Boolean isActive,
                                              LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime end   = endDate   != null ? endDate.atTime(23, 59, 59) : null;
        return couponsRepository.findWithFilters(applyType, isActive, start, end)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public PagedResponse<CouponResponse> getCouponsPaged(ApplyType applyType, Boolean isActive,
                                                         LocalDate startDate, LocalDate endDate,
                                                         int page, int size) {
        LocalDateTime start = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime end   = endDate   != null ? endDate.atTime(23, 59, 59) : null;
        Page<Coupon> couponPage = couponsRepository.findWithFiltersPaged(
                applyType, isActive, start, end, PageRequest.of(page, size));
        return PagedResponse.<CouponResponse>builder()
                .content(couponPage.getContent().stream().map(this::toResponse).collect(Collectors.toList()))
                .page(couponPage.getNumber())
                .size(couponPage.getSize())
                .totalElements(couponPage.getTotalElements())
                .totalPages(couponPage.getTotalPages())
                .first(couponPage.isFirst())
                .last(couponPage.isLast())
                .build();
    }

    @Override
    public CouponResponse createCoupon(CouponRequest request) {
        if (couponsRepository.existsByCode(request.getCode())) {
            throw new AppException(ErrorCode.COUPON_CODE_ALREADY_EXISTS);
        }
        Coupon coupon = buildCoupon(request);
        coupon.setUsedCount(0);
        return toResponse(couponsRepository.save(coupon));
    }

    @Override
    public CouponResponse updateCoupon(Long id, CouponRequest request) {
        Coupon coupon = couponsRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.COUPON_NOT_FOUND));
        if (!coupon.getCode().equals(request.getCode()) && couponsRepository.existsByCode(request.getCode())) {
            throw new AppException(ErrorCode.COUPON_CODE_ALREADY_EXISTS);
        }
        coupon.setCode(request.getCode());
        coupon.setDescription(request.getDescription());
        coupon.setDiscountType(request.getDiscountType());
        coupon.setDiscountValue(request.getDiscountValue());
        coupon.setMaxDiscountAmount(request.getMaxDiscountAmount());
        coupon.setMinOrderValue(request.getMinOrderValue());
        coupon.setApplyType(request.getApplyType());
        coupon.setUsageLimit(request.getUsageLimit());
        coupon.setStartDate(request.getStartDate());
        coupon.setEndDate(request.getEndDate());
        coupon.setActive(request.isActive());
        return toResponse(couponsRepository.save(coupon));
    }

    @Override
    @Transactional
    public CouponResponse updateCouponProducts(Long couponId, Set<Long> productIds) {
        Coupon coupon = couponsRepository.findById(couponId)
                .orElseThrow(() -> new AppException(ErrorCode.COUPON_NOT_FOUND));

        if (coupon.getApplyType() != ApplyType.PRODUCT) {
            throw new AppException(ErrorCode.INVALID_DATA);
        }

        // Fetch product references — only need proxies for the join table
        Set<Product> products = productIds.stream()
                .map(id -> productRepository.getReferenceById(id))
                .collect(Collectors.toSet());

        coupon.setProducts(products);
        return toResponse(couponsRepository.save(coupon));
    }

    @Override
    public void deleteCoupon(Long id) {
        if (!couponsRepository.existsById(id)) {
            throw new AppException(ErrorCode.COUPON_NOT_FOUND);
        }
        couponsRepository.deleteById(id);
    }

    @Override
    public ApplyCouponResponse applyCoupon(ApplyCouponRequest request) {
        Coupon coupon = couponsRepository.findByCode(request.getCode())
                .orElse(null);

        if (coupon == null) {
            return ApplyCouponResponse.builder()
                    .valid(false).message("Mã giảm giá không tồn tại").build();
        }

        // Check active
        if (!coupon.isActive()) {
            return ApplyCouponResponse.builder()
                    .valid(false).message("Mã giảm giá đã bị vô hiệu hóa").build();
        }

        // Check date range
        LocalDateTime now = LocalDateTime.now();
        if (coupon.getStartDate() != null && now.isBefore(coupon.getStartDate())) {
            return ApplyCouponResponse.builder()
                    .valid(false).message("Mã giảm giá chưa đến thời gian sử dụng").build();
        }
        if (coupon.getEndDate() != null && now.isAfter(coupon.getEndDate())) {
            return ApplyCouponResponse.builder()
                    .valid(false).message("Mã giảm giá đã hết hạn").build();
        }

        // Check usage limit
        if (coupon.getUsageLimit() != null && coupon.getUsedCount() >= coupon.getUsageLimit()) {
            return ApplyCouponResponse.builder()
                    .valid(false).message("Mã giảm giá đã đạt giới hạn sử dụng").build();
        }

        // Check minimum order value
        BigDecimal orderTotal = request.getOrderTotal();
        if (coupon.getMinOrderValue() != null &&
                orderTotal.compareTo(coupon.getMinOrderValue()) < 0) {
            return ApplyCouponResponse.builder()
                    .valid(false)
                    .message("Đơn hàng tối thiểu phải đạt " +
                            formatCurrency(coupon.getMinOrderValue()) + " để sử dụng mã này")
                    .build();
        }

        // For PRODUCT type: check cart items contain applicable products
        if (coupon.getApplyType() == ApplyType.PRODUCT) {
            if (request.getCartItems() == null || request.getCartItems().isEmpty()) {
                return ApplyCouponResponse.builder()
                        .valid(false).message("Không có sản phẩm phù hợp trong giỏ hàng").build();
            }
            Set<Long> couponProductIds = coupon.getProducts().stream()
                    .map(p -> p.getId()).collect(Collectors.toSet());
            boolean hasMatch = request.getCartItems().stream()
                    .anyMatch(item -> couponProductIds.contains(item.getProductId()));
            if (!hasMatch) {
                return ApplyCouponResponse.builder()
                        .valid(false).message("Mã giảm giá không áp dụng cho sản phẩm trong giỏ hàng").build();
            }

            // Recalculate orderTotal to only applicable products
            orderTotal = request.getCartItems().stream()
                    .filter(item -> couponProductIds.contains(item.getProductId()))
                    .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        // Calculate discount
        BigDecimal discountAmount;
        if (coupon.getDiscountType() == DiscountType.PERCENTAGE) {
            discountAmount = orderTotal.multiply(coupon.getDiscountValue())
                    .divide(BigDecimal.valueOf(100));
            if (coupon.getMaxDiscountAmount() != null) {
                discountAmount = discountAmount.min(coupon.getMaxDiscountAmount());
            }
        } else {
            discountAmount = coupon.getDiscountValue().min(orderTotal);
        }

        BigDecimal finalTotal = request.getOrderTotal().subtract(discountAmount).max(BigDecimal.ZERO);

        return ApplyCouponResponse.builder()
                .valid(true)
                .message("Áp dụng mã giảm giá thành công!")
                .code(coupon.getCode())
                .discountAmount(discountAmount)
                .originalTotal(request.getOrderTotal())
                .finalTotal(finalTotal)
                .build();
    }

    @Override
    public CouponResponse validateCouponCode(String code) {
        Coupon coupon = couponsRepository.findByCode(code)
                .orElseThrow(() -> new AppException(ErrorCode.COUPON_NOT_FOUND));
        return toResponse(coupon);
    }

    @Override
    @Transactional
    public void markCouponUsed(String code) {
        couponsRepository.findByCode(code).ifPresent(coupon -> {
            coupon.setUsedCount(coupon.getUsedCount() + 1);
            couponsRepository.save(coupon);
        });
    }

    // ── helpers ──────────────────────────────────────────────────

    private Coupon buildCoupon(CouponRequest req) {
        Coupon c = new Coupon();
        c.setCode(req.getCode());
        c.setDescription(req.getDescription());
        c.setDiscountType(req.getDiscountType());
        c.setDiscountValue(req.getDiscountValue());
        c.setMaxDiscountAmount(req.getMaxDiscountAmount());
        c.setMinOrderValue(req.getMinOrderValue());
        c.setApplyType(req.getApplyType());
        c.setUsageLimit(req.getUsageLimit());
        c.setStartDate(req.getStartDate());
        c.setEndDate(req.getEndDate());
        c.setActive(req.isActive());
        return c;
    }

    private CouponResponse toResponse(Coupon coupon) {
        CouponResponse r = new CouponResponse();
        r.setId(coupon.getId());
        r.setCode(coupon.getCode());
        r.setDescription(coupon.getDescription());
        r.setDiscountType(coupon.getDiscountType());
        r.setDiscountValue(coupon.getDiscountValue());
        r.setMaxDiscountAmount(coupon.getMaxDiscountAmount());
        r.setMinOrderValue(coupon.getMinOrderValue());
        r.setApplyType(coupon.getApplyType());
        r.setUsageLimit(coupon.getUsageLimit());
        r.setUsedCount(coupon.getUsedCount());
        r.setStartDate(coupon.getStartDate());
        r.setEndDate(coupon.getEndDate());
        r.setActive(coupon.isActive());
        if (coupon.getProducts() != null) {
            r.setAppliedProductIds(coupon.getProducts().stream()
                    .map(p -> p.getId()).collect(Collectors.toSet()));
        }
        return r;
    }

    private String formatCurrency(BigDecimal amount) {
        return String.format("%,.0f đ", amount);
    }
}