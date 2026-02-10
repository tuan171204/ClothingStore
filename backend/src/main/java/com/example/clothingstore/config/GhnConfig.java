package com.example.clothingstore.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Getter
public class GhnConfig {
    @Value("${shipping.ghn.fee-url}")
    private String ghnFeeUrl;

    private final String ghnCreateOrderUrl = "https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/create";

    private final String ghnAddressUrl = "https://dev-online-gateway.ghn.vn/shiip/public-api/master-data";

    private final String ghnProvinceUrl = ghnAddressUrl + "/province";

    private final String ghnDistrictUrl = ghnAddressUrl + "/district";

    private final String ghnWardUrl = ghnAddressUrl + "/ward";

    @Value("${shipping.ghn.api-key}")
    private String ghnToken;

    @Value("${shipping.ghn.shop-id}")
    private String ghnShopId;

    @Value("${shipping.ghn.shop-district-id}")
    private Integer shopDistrictId;
}