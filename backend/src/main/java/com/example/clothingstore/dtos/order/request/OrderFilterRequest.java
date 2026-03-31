package com.example.clothingstore.dtos.order.request;

import com.example.clothingstore.entity.Enum.OrderStatus;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDateTime;

@Data
public class OrderFilterRequest {
    private String keyword;          // Tìm theo mã đơn (id) hoặc tên khách
    private OrderStatus status;      // Lọc theo trạng thái
    private String paymentMethod;    // COD | VNPAY

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime fromDate;  // Từ ngày

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime toDate;    // Đến ngày

    private int page = 0;
    private int size = 10;
}