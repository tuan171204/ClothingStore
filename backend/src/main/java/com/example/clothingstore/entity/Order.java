package com.example.clothingstore.entity;

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
    private Long userId; // Có thể null nếu là khách vãng lai

    // --- Thông tin khách hàng (Snapshot lưu tại thời điểm đặt) ---
    @Column(name = "full_name")
    private String fullName;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "shipping_address")
    private String shippingAddress;
    // -------------------------------------------------------------

    @Column(name = "subtotal")
    private BigDecimal subtotal; // Tổng tiền hàng

    @Column(name = "shipping_fee")
    private BigDecimal shippingFee; // Phí ship

    @Column(name = "discount_amount")
    private BigDecimal discountAmount; // Giảm giá

    @Column(name = "total_amount")
    private BigDecimal totalAmount; // Tổng thanh toán cuối cùng

    @Enumerated(EnumType.STRING)
    private OrderStatus status;

    @Column(name = "payment_method")
    private String paymentMethod; // COD, VNPAY

    @Column(name = "note")
    private String note;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // Quan hệ 1-N với OrderItems
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