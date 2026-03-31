package com.example.clothingstore.service;

import com.example.clothingstore.dtos.coupon.request.CouponRequest;   // Sửa dòng này
import com.example.clothingstore.dtos.coupon.response.CouponResponse;
import java.util.List;
public interface CouponsService {
    List<CouponResponse> getAllCoupons();
    CouponResponse createCoupon(CouponRequest request);
    CouponResponse updateCoupon(Long id, CouponRequest request);
    void deleteCoupon(Long id);
}