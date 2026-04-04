package com.example.clothingstore.dtos.coupon.request;

import java.util.Set;

public record CouponProductMappingRequest(Set<Long> productIds) {}