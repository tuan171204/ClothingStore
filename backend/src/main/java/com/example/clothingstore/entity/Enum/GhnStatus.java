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

    // ---- Trạng thái "đang trong luồng giao" ----
    READY_TO_PICK("ready_to_pick", null),       // Không cần đổi OrderStatus
    PICKING("picking",             null),
    PICKED("picked",               null),
    ON_HOLD("on_hold",             null),
    IN_TRANSIT("in_transit",       null),
    OUT_FOR_DELIVERY("out_for_delivery", null),

    // ---- Trạng thái cuối — CÓ ảnh hưởng tới OrderStatus ----
    DELIVERED("delivered",         OrderStatus.COMPLETED),
    CANCEL("cancel",               OrderStatus.CANCELLED),
    RETURN("return",               OrderStatus.CANCELLED),
    RETURN_TRANSIT("return_transit", OrderStatus.CANCELLED),
    RETURNED("returned",           OrderStatus.CANCELLED),

    // ---- Trạng thái đặc biệt ----
    EXCEPTION("exception",         null),
    DAMAGE("damage",               null),
    LOST("lost",                   OrderStatus.CANCELLED),

    UNKNOWN("unknown",             null);

    /** Chuỗi trạng thái GHN trả về trong webhook payload */
    private final String ghnCode;

    /**
     * OrderStatus tương ứng trong hệ thống.
     * null = không cần cập nhật OrderStatus khi nhận được trạng thái này.
     */
    private final OrderStatus mappedOrderStatus;

    /**
     * Parse chuỗi trạng thái từ GHN.
     * Trả về UNKNOWN nếu không khớp bất kỳ enum nào (tránh exception).
     */
    public static GhnStatus fromCode(String code) {
        if (code == null) return UNKNOWN;
        String lower = code.toLowerCase().trim();
        for (GhnStatus s : values()) {
            if (s.ghnCode.equals(lower)) return s;
        }
        return UNKNOWN;
    }

    /** Kiểm tra trạng thái này có cần cập nhật OrderStatus không */
    public boolean hasMappedStatus() {
        return mappedOrderStatus != null;
    }
}