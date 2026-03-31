package com.example.clothingstore.controller;

import com.example.clothingstore.dtos.coupon.request.CouponRequest;   // Sửa dòng này
import com.example.clothingstore.dtos.coupon.response.CouponResponse;
import com.example.clothingstore.service.CouponsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController
@RequestMapping("${api.prefix}/coupons")
@RequiredArgsConstructor
public class CouponsController {
    private final CouponsService couponsService;
    @GetMapping
    public ResponseEntity<List<CouponResponse>> getAllCoupons() {
        return ResponseEntity.ok(couponsService.getAllCoupons());
    }
    @PostMapping
    public ResponseEntity<CouponResponse> createCoupon(@RequestBody CouponRequest request) {
        return ResponseEntity.ok(couponsService.createCoupon(request));
    }
    @PutMapping("/{id}")
    public ResponseEntity<CouponResponse> updateCoupon(
            @PathVariable Long id, @RequestBody CouponRequest request) {
        return ResponseEntity.ok(couponsService.updateCoupon(id, request));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCoupon(@PathVariable Long id) {
        couponsService.deleteCoupon(id);
        return ResponseEntity.noContent().build();
    }
}