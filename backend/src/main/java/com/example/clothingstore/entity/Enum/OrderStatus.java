package com.example.clothingstore.entity.Enum;

public enum OrderStatus {
    PENDING,    // Chờ xử lý (Mới đặt)
    CONFIRMED,  // Đã xác nhận (Admin duyệt)
    SHIPPING,   // Đang giao
    COMPLETED,  // Hoàn thành
    CANCELLED,   // Đã hủy
    RETURN_REQUESTED,  // Khách yêu cầu hoàn trả — chờ Admin xét duyệt
    RETURNED
}
