package com.example.clothingstore.controller;

import com.example.clothingstore.service.impl.GhnService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("${api.prefix}/shipping")
@RequiredArgsConstructor
public class ShippingController {

    private final GhnService ghnService;

    // API tính phí ship
    // GET /api/v1/shipping/calculate?districtId=1454&wardCode=21012&weight=1000
    @GetMapping("/calculate")
    public ResponseEntity<Integer> calculateFee(
            @RequestParam Integer districtId,
            @RequestParam String wardCode,
            @RequestParam(defaultValue = "1000") Integer weight // Mặc định 1kg
    ) {
        Integer fee = ghnService.calculateShippingFee(districtId, wardCode, weight);
        return ResponseEntity.ok(fee);
    }

    // 1. Lấy danh sách Tỉnh
    // GET /api/v1/shipping/provinces
    @GetMapping("/provinces")
    public ResponseEntity<?> getProvinces() {
        return ResponseEntity.ok(ghnService.getProvinces());
    }

    // 2. Lấy danh sách Huyện (truyền province_id)
    // GET /api/v1/shipping/districts?provinceId=201
    @GetMapping("/districts")
    public ResponseEntity<?> getDistricts(@RequestParam Integer provinceId) {
        return ResponseEntity.ok(ghnService.getDistricts(provinceId));
    }

    // 3. Lấy danh sách Xã (truyền district_id)
    // GET /api/v1/shipping/wards?districtId=1442
    @GetMapping("/wards")
    public ResponseEntity<?> getWards(@RequestParam Integer districtId) {
        return ResponseEntity.ok(ghnService.getWards(districtId));
    }
}