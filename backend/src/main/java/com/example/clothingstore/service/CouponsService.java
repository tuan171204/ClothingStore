package com.example.clothingstore.service;

import com.example.clothingstore.dtos.PagedResponse;
import com.example.clothingstore.dtos.coupon.request.ApplyCouponRequest;
import com.example.clothingstore.dtos.coupon.request.CouponRequest;
import com.example.clothingstore.dtos.coupon.response.ApplyCouponResponse;
import com.example.clothingstore.dtos.coupon.response.CouponResponse;
import com.example.clothingstore.entity.Enum.ApplyType;

import java.time.LocalDate;
import java.util.List;

public interface CouponsService {

    List<CouponResponse> getAllCoupons(ApplyType applyType, Boolean isActive,
                                       LocalDate startDate, LocalDate endDate);

    /** @deprecated Use getAllCoupons with filters */
    @Deprecated
    default List<CouponResponse> getAllCoupons() {
        return getAllCoupons(null, null, null, null);
    }

    PagedResponse<CouponResponse> getCouponsPaged(ApplyType applyType, Boolean isActive,
                                                  LocalDate startDate, LocalDate endDate,
                                                  int page, int size);

    CouponResponse createCoupon(CouponRequest request);

    CouponResponse updateCoupon(Long id, CouponRequest request);

    void deleteCoupon(Long id);

    /**
     * Validates and calculates the discount for a given coupon code.
     * Does NOT increment usedCount — that happens at order confirmation.
     */
    ApplyCouponResponse applyCoupon(ApplyCouponRequest request);

    /**
     * Validates a coupon code exists and is currently active/valid.
     * Returns the coupon details for display in checkout UI.
     */
    CouponResponse validateCouponCode(String code);

    /**
     * Called internally at order confirmation to increment the usedCount.
     */
    void markCouponUsed(String code);
}