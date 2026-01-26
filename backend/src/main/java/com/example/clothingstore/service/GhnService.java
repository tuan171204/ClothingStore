package com.example.clothingstore.service;

import com.example.clothingstore.config.GhnConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GhnService {

    private final GhnConfig ghnConfig;
    private final RestTemplate restTemplate;

    public Integer calculateShippingFee(Integer toDistrictId, String toWardCode, Integer weight) {
        // 1. Tạo Header chứa Token và ShopID
        HttpHeaders headers = new HttpHeaders();
        headers.set("Token", ghnConfig.getGhnToken());
        headers.set("ShopId", ghnConfig.getGhnShopId());
        headers.setContentType(MediaType.APPLICATION_JSON);

        // 2. Tạo Body request (Dữ liệu gửi đi)
        Map<String, Object> payload = new HashMap<>();
        payload.put("service_type_id", 2); // 2 = Giao hàng chuẩn (Standard)
        payload.put("from_district_id", ghnConfig.getShopDistrictId());
        payload.put("to_district_id", toDistrictId);
        payload.put("to_ward_code", toWardCode);
        payload.put("height", 20); // Kích thước gói hàng (demo)
        payload.put("length", 20);
        payload.put("width", 20);
        payload.put("weight", weight); // Gram (VD: 1000g)
        payload.put("insurance_value", 0); // Giá trị bảo hiểm (để 0 cho đơn giản)
        payload.put("coupon", null); // Mã giảm giá (nếu có)

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

        try {
            // 3. Gọi API GHN
            ResponseEntity<Map> response = restTemplate.exchange(
                    ghnConfig.getGhnUrl(),
                    HttpMethod.POST,
                    entity,
                    Map.class
            );

            // 4. Lấy kết quả trả về
            if (response.getBody() != null && response.getBody().containsKey("data")) {
                Map<String, Object> data = (Map<String, Object>) response.getBody().get("data");
                return (Integer) data.get("total"); // Trả về phí ship (VNĐ)
            }
        } catch (Exception e) {
            System.err.println("Lỗi tính phí GHN: " + e.getMessage());
            return 30000; // Nếu lỗi thì trả về phí mặc định 30k
        }
        return 30000;
    }

    public List<Map<String, Object>> getProvinces() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Token", ghnConfig.getGhnToken());
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            // URL API lấy tỉnh của GHN
            String url = "https://online-gateway.ghn.vn/shiip/public-api/master-data/province";

            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);

            if (response.getBody() != null && response.getBody().containsKey("data")) {
                return (List<Map<String, Object>>) response.getBody().get("data");
            }
        } catch (Exception e) {
            System.err.println("Lỗi lấy Tỉnh GHN: " + e.getMessage());
        }
        return new ArrayList<>();
    }

    // Thêm hàm lấy danh sách Quận/Huyện theo Tỉnh
    public List<Map<String, Object>> getDistricts(Integer provinceId) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Token", ghnConfig.getGhnToken());
        headers.setContentType(MediaType.APPLICATION_JSON);

        // GHN yêu cầu gửi province_id qua body hoặc param (ở đây dùng body cho chắc)
        Map<String, Object> body = new HashMap<>();
        body.put("province_id", provinceId);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            String url = "https://online-gateway.ghn.vn/shiip/public-api/master-data/district";

            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class); // POST theo tài liệu mới GHN

            if (response.getBody() != null && response.getBody().containsKey("data")) {
                return (List<Map<String, Object>>) response.getBody().get("data");
            }
        } catch (Exception e) {
            System.err.println("Lỗi lấy Huyện GHN: " + e.getMessage());
        }
        return new ArrayList<>();
    }

    // Thêm hàm lấy danh sách Phường/Xã theo Huyện
    public List<Map<String, Object>> getWards(Integer districtId) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Token", ghnConfig.getGhnToken());
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new HashMap<>();
        body.put("district_id", districtId);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            String url = "https://online-gateway.ghn.vn/shiip/public-api/master-data/ward"; // Có bản v2 là master-data/ward?district_id

            // Dùng GET hay POST tuỳ version, hiện tại API v2 dùng POST body cũng được hoặc GET params
            // Thử dùng POST cho đồng bộ với District
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);

            if (response.getBody() != null && response.getBody().containsKey("data")) {
                return (List<Map<String, Object>>) response.getBody().get("data");
            }
        } catch (Exception e) {
            System.err.println("Lỗi lấy Xã GHN: " + e.getMessage());
        }
        return new ArrayList<>();
    }
}