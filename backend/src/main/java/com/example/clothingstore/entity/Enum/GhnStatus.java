package com.example.clothingstore.entity.Enum;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Ánh xạ trạng thái GHN sang OrderStatus nội bộ.
 *
 * Tham chiếu: https://api.ghn.vn/home/docs/detail?id=84
 *
 * Các trạng thái GHN có thể nhận qua webhook:
 *   ready_to_pick  – Chờ lấy hàng
 *   picking        – Đang lấy hàng
 *   picked         – Đã lấy hàng
 *   on_hold        – Tạm giữ
 *   in_transit     – Đang trung chuyển
 *   out_for_delivery (hoặc delivering) – Đang giao tới khách
 *   delivered      – Giao thành công   → COMPLETED
 *   cancel         – Hủy đơn          → CANCELLED
 *   return         – Bắt đầu hoàn     → CANCELLED
 *   return_transit – Đang hoàn        → CANCELLED
 *   returned       – Đã hoàn về shop  → CANCELLED
 *   exception      – Ngoại lệ
 *   damage         – Hàng bị hỏng
 *   lost           – Thất lạc
 */
@Getter
@RequiredArgsConstructor
public enum GhnStatus {

    // ---- Luồng giao hàng tiến (không thay đổi OrderStatus) ----
    READY_TO_PICK(
            "ready_to_pick",
            null,
            "Đơn hàng đang chờ shipper đến lấy"
    ),
    PICKING(
            "picking",
            null,
            "Shipper đang trên đường đến lấy hàng"
    ),
    PICKED(
            "picked",
            null,
            "Shipper đã lấy hàng, đang vận chuyển"
    ),
    STORING(
            "storing",
            null,
            "Hàng đang được lưu kho trung chuyển"
    ),
    TRANSPORTING(
            "transporting",
            null,
            "Hàng đang được vận chuyển liên tỉnh"
    ),
    SORTING(
            "sorting",
            null,
            "Hàng đang được phân loại tại bưu cục"
    ),
    ON_HOLD(
            "on_hold",
            null,
            "Đơn hàng tạm dừng, chúng tôi đang liên hệ bạn"
    ),
    IN_TRANSIT(
            "in_transit",
            null,
            "Hàng đang trên đường đến bưu cục gần bạn"
    ),
    DELIVERING(
            "delivering",
            null,
            "Shipper đang giao hàng đến bạn"
    ),
    DELIVERY_FAIL(
            "delivery_fail",
            null,
            "Giao hàng thất bại, shipper sẽ thử lại"
    ),

    // ---- Trạng thái cuối — thay đổi OrderStatus ----
    DELIVERED(
            "delivered",
            OrderStatus.COMPLETED,
            "Giao hàng thành công. Cảm ơn bạn đã mua hàng!"
    ),
    CANCEL(
            "cancel",
            OrderStatus.CANCELLED,
            "Đơn hàng đã bị hủy"
    ),
    RETURN(
            "return",
            OrderStatus.CANCELLED,
            "Đơn hàng đang được hoàn trả về người gửi"
    ),
    RETURN_TRANSIT(
            "return_transit",
            OrderStatus.CANCELLED,
            "Hàng đang trên đường hoàn về người bán"
    ),
    RETURNED(
            "returned",
            OrderStatus.CANCELLED,
            "Hàng đã được hoàn về người bán thành công"
    ),
    LOST(
            "lost",
            OrderStatus.CANCELLED,
            "Hàng bị thất lạc trong quá trình vận chuyển"
    ),
    DAMAGE(
            "damage",
            null,
            "Hàng bị hư hỏng trong quá trình vận chuyển"
    ),
    EXCEPTION(
            "exception",
            null,
            "Xảy ra sự cố trong quá trình vận chuyển, đang xử lý"
    ),

    UNKNOWN(
            "unknown",
            null,
            "Đang cập nhật trạng thái vận chuyển"
    );

    /** Chuỗi status code GHN gửi trong webhook payload */
    private final String ghnCode;

    /**
     * OrderStatus tương ứng trong hệ thống.
     * null = không cần cập nhật OrderStatus khi nhận trạng thái này.
     */
    private final OrderStatus mappedOrderStatus;

    /**
     * Thông báo thân thiện hiển thị cho khách hàng xem trên trang đơn hàng.
     */
    private final String trackingMessage;

    /**
     * Parse chuỗi status từ GHN.
     * Case-insensitive, trim whitespace.
     * Trả về UNKNOWN nếu không khớp (tránh exception).
     */
    public static GhnStatus fromCode(String code) {
        if (code == null || code.isBlank()) return UNKNOWN;
        String normalized = code.toLowerCase().trim();
        for (GhnStatus s : values()) {
            if (s.ghnCode.equals(normalized)) return s;
        }
        return UNKNOWN;
    }

    /** true nếu trạng thái này cần cập nhật OrderStatus */
    public boolean hasMappedStatus() {
        return mappedOrderStatus != null;
    }
}