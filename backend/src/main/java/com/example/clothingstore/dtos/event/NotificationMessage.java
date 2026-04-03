package com.example.clothingstore.dtos.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class NotificationMessage {
    private String type;         // VD: "NEW_ORDER", "LOW_STOCK"
    private String referenceId;  // ID tham chiếu (orderId, skuId)
    private String message;      // Nội dung chi tiết
}