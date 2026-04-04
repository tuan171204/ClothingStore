package com.example.clothingstore.controller;

import com.example.clothingstore.dtos.coupon.request.CouponProductMappingRequest;
import com.example.clothingstore.dtos.coupon.request.CouponRequest;
import com.example.clothingstore.dtos.coupon.request.ApplyCouponRequest;
import com.example.clothingstore.dtos.coupon.response.CouponResponse;
import com.example.clothingstore.dtos.coupon.response.ApplyCouponResponse;
import com.example.clothingstore.dtos.PagedResponse;
import com.example.clothingstore.entity.Enum.ApplyType;
import com.example.clothingstore.service.CouponsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("${api.prefix}/coupons")
@RequiredArgsConstructor
public class CouponsController {
    private final CouponsService couponsService;

    /**
     * GET /coupons?applyType=ORDER&startDate=2026-01-01&endDate=2026-12-31&page=0&size=10
     */
    @GetMapping
    public ResponseEntity<?> getAllCoupons(
            @RequestParam(required = false) ApplyType applyType,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false, defaultValue = "false") boolean paginate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        if (paginate) {
            PagedResponse<CouponResponse> result = couponsService.getCouponsPaged(
                    applyType, isActive, startDate, endDate, page, size);
            return ResponseEntity.ok(result);
        }
        List<CouponResponse> coupons = couponsService.getAllCoupons(applyType, isActive, startDate, endDate);
        return ResponseEntity.ok(coupons);
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

    /**
     * POST /coupons/apply
     * Validates and applies a coupon code at checkout
     */
    @PostMapping("/apply")
    public ResponseEntity<ApplyCouponResponse> applyCoupon(@RequestBody ApplyCouponRequest request) {
        return ResponseEntity.ok(couponsService.applyCoupon(request));
    }

    /**
     * GET /coupons/validate/{code}
     * Quick validation for a coupon code
     */
    @GetMapping("/validate/{code}")
    public ResponseEntity<CouponResponse> validateCoupon(@PathVariable String code) {
        return ResponseEntity.ok(couponsService.validateCouponCode(code));
    }

    /**
     * PUT /coupons/{id}/products
     * Replaces the full set of products linked to this PRODUCT-type coupon.
     */
    @PutMapping("/{id}/products")
    public ResponseEntity<CouponResponse> updateCouponProducts(
            @PathVariable Long id,
            @RequestBody CouponProductMappingRequest request) {
        return ResponseEntity.ok(couponsService.updateCouponProducts(id, request.productIds()));
    }
}