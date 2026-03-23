package com.example.clothingstore.entity.Enum;

public enum StockMovementType {
    IN,          // Nhập kho (từ GRN đã xác nhận)
    OUT,         // Xuất kho (đơn hàng hoàn thành)
    ADJUSTMENT,  // Điều chỉnh tồn kho thủ công
    RESERVE,     // Giữ chỗ khi đơn hàng tạo
    RELEASE      // Giải phóng khi đơn hàng bị hủy
}