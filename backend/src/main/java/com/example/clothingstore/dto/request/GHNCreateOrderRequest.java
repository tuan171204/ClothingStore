package com.example.clothingstore.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class GHNCreateOrderRequest {
    @JsonProperty("payment_type_id")
    private int paymentTypeId; // 1: Người bán trả phí ship, 2: Người mua trả

    @JsonProperty("note")
    private String note;

    @JsonProperty("required_note")
    private String requiredNote; // KHONGCHOXEMHANG, CHOXEMHANGKHONGTHU...

    @JsonProperty("to_name")
    private String toName;

    @JsonProperty("to_phone")
    private String toPhone;

    @JsonProperty("to_address")
    private String toAddress;

    @JsonProperty("to_ward_code")
    private String toWardCode;

    @JsonProperty("to_district_id")
    private int toDistrictId;

    @JsonProperty("cod_amount")
    private int codAmount; // Tiền thu hộ

    @JsonProperty("weight")
    private int weight; // Gram

    @JsonProperty("length")
    private int length;
    @JsonProperty("width")
    private int width;
    @JsonProperty("height")
    private int height;

    @JsonProperty("service_id")
    private int serviceId; // Gói vận chuyển (Nhanh/Thường) - Lấy từ lúc tính phí

    @JsonProperty("service_type_id")
    private int serviceTypeId;

    @JsonProperty("items")
    private List<GHNItem> items;

    @Data
    @Builder
    public static class GHNItem {
        @JsonProperty("name")
        private String name;
        @JsonProperty("code")
        private String code;
        @JsonProperty("quantity")
        private int quantity;
        @JsonProperty("price")
        private int price;
        @JsonProperty("weight")
        private int weight;
    }
}