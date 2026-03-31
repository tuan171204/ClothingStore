// CheckoutRequest.java
package com.example.clothingstore.dtos.order.request;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class CheckoutRequest {
    private String fullName;
    private String phoneNumber;
    private String address;
    private Integer toProvinceId;
    private Integer toDistrictId;
    private String toWardCode;
    private String note;
    private BigDecimal shippingFee;
    private String paymentMethod;

    // Frontend gửi snapshot giỏ hàng tại thời điểm checkout
    private List<CheckoutItem> items;

    @Data
    public static class CheckoutItem {
        private Long skuId;
        private String productName;
        private int quantity;
        private BigDecimal price;
    }
}