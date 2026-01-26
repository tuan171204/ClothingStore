package com.example.clothingstore.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Getter
public class GhnConfig {
    @Value("${shipping.ghn.url}")
    private String ghnUrl;

    @Value("${shipping.ghn.api-key}")
    private String ghnToken;

    @Value("${shipping.ghn.shop-id}")
    private String ghnShopId;

    @Value("${shipping.ghn.shop-district-id}")
    private Integer shopDistrictId;
}