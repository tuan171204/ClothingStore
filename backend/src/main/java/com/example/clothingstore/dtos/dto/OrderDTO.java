package com.example.clothingstore.dtos.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class OrderDTO {
    private String fullName;
    private String phoneNumber;
    private String address; // Địa chỉ full
    private Integer toProvinceId;
    private Integer toDistrictId;
    private String toWardCode;
    private String note;

    private BigDecimal shippingFee;
    private String paymentMethod;

    // Danh sách sản phẩm trong giỏ
    private List<CartItemDTO> items;

    @Data
    public static class CartItemDTO {
        private Long skuId;
        private String name;
        private int quantity;
        private BigDecimal price;
    }
}