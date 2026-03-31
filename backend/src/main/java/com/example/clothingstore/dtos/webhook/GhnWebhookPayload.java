package com.example.clothingstore.dtos.webhook;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.math.BigDecimal;

/**
 * DTO ánh xạ payload JSON từ GHN Webhook.
 *
 * Tài liệu GHN: https://api.ghn.vn/home/docs/detail?id=84
 *
 * Các field dùng PascalCase theo chuẩn GHN, @JsonProperty map sang camelCase Java.
 */
@Data
public class GhnWebhookPayload {

    /**
     * Loại sự kiện: create | switch_status | update_weight | update_cod | update_fee
     */
    @JsonProperty("Type")
    private String type;

    /**
     * Thời gian sự kiện xảy ra (ISO 8601), dùng làm idempotency key.
     * VD: "2021-11-11T03:52:50.158Z"
     */
    @JsonProperty("Time")
    private String time;

    /** ID shop trên GHN — dùng để validate request có đúng shop không */
    @JsonProperty("ShopID")
    private Integer shopId;

    /** Mã vận đơn GHN (tracking code) — key để tìm Order trong DB */
    @JsonProperty("OrderCode")
    private String orderCode;

    /** Mã đơn hàng nội bộ của shop (nếu được set lúc tạo đơn GHN) */
    @JsonProperty("ClientOrderCode")
    private String clientOrderCode;

    /**
     * Trạng thái đơn hàng GHN.
     * Các giá trị quan trọng:
     *   ready_to_pick → chờ lấy hàng
     *   picking        → đang lấy hàng
     *   picked         → đã lấy
     *   in_transit     → đang giao
     *   delivered      → giao thành công
     *   cancel         → đã hủy
     *   return         / return_transit / returned → đang hoàn / đã hoàn
     */
    @JsonProperty("Status")
    private String status;

    /** Mô tả ngắn về sự kiện (VD: "Tạo đơn hàng", "Đang giao") */
    @JsonProperty("Description")
    private String description;

    // ---- Thông tin hàng hóa (dùng cho update_weight) ----

    @JsonProperty("Weight")
    private Integer weight;

    @JsonProperty("ConvertedWeight")
    private Integer convertedWeight;

    // ---- Thanh toán (dùng cho update_cod) ----

    /** Số tiền COD (đồng) */
    @JsonProperty("CODAmount")
    private Long codAmount;

    /** Ngày chuyển tiền COD về shop (nullable) */
    @JsonProperty("CODTransferDate")
    private String codTransferDate;

    // ---- Phí vận chuyển (dùng cho update_fee) ----

    @JsonProperty("TotalFee")
    private Long totalFee;

    @JsonProperty("Fee")
    private FeeDetail fee;

    /** Lý do (dùng khi hủy/hoàn hàng) */
    @JsonProperty("Reason")
    private String reason;

    @JsonProperty("ReasonCode")
    private String reasonCode;

    // ----------------------------------------------------------------
    // Inner class
    // ----------------------------------------------------------------

    @Data
    public static class FeeDetail {
        @JsonProperty("MainService")
        private Long mainService;

        @JsonProperty("Insurance")
        private Long insurance;

        @JsonProperty("CODFee")
        private Long codFee;

        @JsonProperty("Coupon")
        private Long coupon;

        @JsonProperty("Total")
        private Long total;
    }
}