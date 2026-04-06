package com.example.clothingstore.entity;

import com.example.clothingstore.entity.Enum.OrderStatus;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private String userId;

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "shipping_address")
    private String shippingAddress;

    @Column(name = "to_province_id")
    private Integer toProvinceId;

    @Column(name = "to_district_id")
    private Integer toDistrictId;

    @Column(name = "to_ward_code")
    private String toWardCode;

    @Column(name = "subtotal")
    private BigDecimal subtotal;

    @Column(name = "shipping_fee")
    private BigDecimal shippingFee;

    @Column(name = "coupon_code", length = 50)
    private String couponCode;

    @Column(name = "discount_amount")
    private BigDecimal discountAmount;

    @Column(name = "total_amount")
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    private OrderStatus status;

    @Column(name = "payment_method")
    private String paymentMethod;

    @Column(name = "note")
    private String note;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "tracking_code")
    private String trackingCode;

    /**
     * Trạng thái vận chuyển raw từ GHN.
     * Dùng để ánh xạ chính xác mà không mất thông tin.
     * VD: "ready_to_pick", "delivering", "delivered", "return_transit"
     */
    @Column(name = "tracking_status", length = 50)
    private String trackingStatus;

    /**
     * Chuỗi thông báo thân thiện hiển thị cho khách hàng.
     * VD: "Đơn hàng đang trên đường giao đến bạn"
     * Được cập nhật mỗi lần GHN gọi webhook switch_status.
     */
    @Column(name = "tracking_message", length = 255)
    private String trackingMessage;

    /**
     * Lý do hủy đơn — do khách điền khi bấm "Hủy đơn".
     */
    @Column(name = "cancel_reason", length = 500)
    private String cancelReason;

    /**
     * Thời điểm khách/admin hủy đơn.
     */
    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    /**
     * Lý do yêu cầu hoàn trả ngắn gọn (dropdown value từ FE).
     * VD: "DEFECTIVE", "WRONG_ITEM", "NOT_AS_DESCRIBED", "OTHER"
     */
    @Column(name = "return_reason", length = 100)
    private String returnReason;

    /**
     * Mô tả chi tiết từ khách khi yêu cầu hoàn trả.
     */
    @Column(name = "return_description", columnDefinition = "TEXT")
    private String returnDescription;

    /**
     * Danh sách URL ảnh bằng chứng khách upload, lưu dạng JSON array.
     * VD: ["https://res.cloudinary.com/...", "https://..."]
     */
    @Column(name = "return_images", columnDefinition = "TEXT")
    private String returnImages;

    /**
     * Thời điểm khách gửi yêu cầu hoàn trả.
     */
    @Column(name = "return_requested_at")
    private LocalDateTime returnRequestedAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private List<OrderItem> orderItems;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = OrderStatus.PENDING;
        }
    }
}