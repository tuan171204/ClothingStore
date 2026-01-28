package com.example.clothingstore.dto.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderMessage implements Serializable {
    private Long orderId;
    private String message; // Ví dụ: "Gửi mail xác nhận đơn hàng"
}