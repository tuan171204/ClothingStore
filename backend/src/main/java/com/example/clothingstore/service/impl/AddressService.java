package com.example.clothingstore.service.impl;

import com.example.clothingstore.repository.address.DistrictRepository;
import com.example.clothingstore.repository.address.ProvinceRepository;
import com.example.clothingstore.repository.address.WardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
public class AddressService {
    private final ProvinceRepository provinceRepository;
    private final DistrictRepository districtRepository;
    private final WardRepository wardRepository;
    private final RestTemplate restTemplate;

    // Token GHTK Sandbox (Thay bằng token của bạn)
    private static final String GHTK_TOKEN = "TOKEN_CUA_BAN_O_DAY";

    // URL API (Check docs mới nhất của GHTK, đây là URL mẫu thường dùng)
    private static final String BASE_URL = "https://services.staging.ghtklab.com";
}
