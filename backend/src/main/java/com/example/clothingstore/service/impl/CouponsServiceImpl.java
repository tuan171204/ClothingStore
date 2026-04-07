package com.example.clothingstore.service.impl;

import com.example.clothingstore.dtos.coupon.request.CouponRequest;
import com.example.clothingstore.dtos.coupon.response.CouponResponse;
import com.example.clothingstore.entity.ApplyType;
import com.example.clothingstore.entity.Coupon; 
import com.example.clothingstore.entity.Product;
import com.example.clothingstore.exception.AppException;
import com.example.clothingstore.exception.ErrorCode;
import com.example.clothingstore.repository.CouponsRepository;
import com.example.clothingstore.repository.ProductRepository;
import com.example.clothingstore.service.CouponsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CouponsServiceImpl implements CouponsService {

    private final CouponsRepository couponsRepository;
    private final ProductRepository productRepository;

    @Override
    public List<CouponResponse> getAllCoupons() {
        // Chỗ này đổi thành Coupon (không có s)
        List<Coupon> couponsList = couponsRepository.findAll();
        
        return couponsList.stream().map(coupon -> {
            CouponResponse response = new CouponResponse();
            response.setId(coupon.getId());
            response.setCode(coupon.getCode());
            response.setDescription(coupon.getDescription());
            response.setDiscountType(coupon.getDiscountType());
            response.setDiscountValue(coupon.getDiscountValue());
            response.setMaxDiscountAmount(coupon.getMaxDiscountAmount());
            response.setMinOrderValue(coupon.getMinOrderValue());
            response.setApplyType(coupon.getApplyType());
            response.setUsageLimit(coupon.getUsageLimit());
            response.setUsedCount(coupon.getUsedCount());
            response.setStartDate(coupon.getStartDate());
            response.setEndDate(coupon.getEndDate());
            response.setActive(coupon.isActive());
            
            if (coupon.getProducts() != null) {
                response.setAppliedProductIds(coupon.getProducts().stream()
                        .map(p -> p.getId())
                        .collect(Collectors.toSet()));
            }
            return response;
        }).collect(Collectors.toList());
    }

    @Override
    public CouponResponse createCoupon(CouponRequest request) {
        if (couponsRepository.existsByCode(request.getCode())) {
            throw new AppException(ErrorCode.COUPON_CODE_ALREADY_EXISTS);
        }

        // Đổi thành Coupon (không có s)
        Coupon coupon = new Coupon();
        coupon.setCode(request.getCode());
        coupon.setDescription(request.getDescription());
        coupon.setDiscountType(request.getDiscountType());
        coupon.setDiscountValue(request.getDiscountValue());
        coupon.setMaxDiscountAmount(request.getMaxDiscountAmount());
        coupon.setMinOrderValue(request.getMinOrderValue());
        coupon.setApplyType(request.getApplyType());
        coupon.setUsageLimit(request.getUsageLimit());
        coupon.setUsedCount(0);
        coupon.setStartDate(request.getStartDate());
        coupon.setEndDate(request.getEndDate());
        coupon.setActive(request.isActive());
        coupon.setProducts(resolveAppliedProducts(request));

        coupon = couponsRepository.save(coupon);

        CouponResponse response = new CouponResponse();
        response.setId(coupon.getId());
        response.setCode(coupon.getCode());
        response.setUsedCount(coupon.getUsedCount());
        // Thu có thể set thêm các trường khác vào response nếu cần
        return response;
    }

    @Override
    public CouponResponse updateCoupon(Long id, CouponRequest request) {
        // Đổi thành Coupon (không có s)
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
        coupon.setProducts(resolveAppliedProducts(request));

        coupon = couponsRepository.save(coupon);

        CouponResponse response = new CouponResponse();
        response.setId(coupon.getId());
        response.setCode(coupon.getCode());
        return response;
    }

    @Override
    public void deleteCoupon(Long id) {
        if (!couponsRepository.existsById(id)) {
            throw new AppException(ErrorCode.COUPON_NOT_FOUND);
        }
        couponsRepository.deleteById(id);
    }

    private Set<Product> resolveAppliedProducts(CouponRequest request) {
        if (request.getApplyType() != ApplyType.PRODUCT) {
            return new HashSet<>();
        }

        Set<Long> ids = request.getAppliedProductIds();
        if (ids == null || ids.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_DATA);
        }

        List<Product> products = productRepository.findAllById(ids);
        if (products.size() != ids.size()) {
            throw new AppException(ErrorCode.INVALID_DATA);
        }

        return new HashSet<>(products);
    }
}