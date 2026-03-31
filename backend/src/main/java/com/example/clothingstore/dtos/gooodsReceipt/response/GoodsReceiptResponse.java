// ======== GoodsReceiptResponse.java ========
package com.example.clothingstore.dtos.gooodsReceipt.response;

import com.example.clothingstore.entity.Enum.GrnStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class GoodsReceiptResponse {
    Long id;
    String createdBy;
    GrnStatus status;
    String note;
    LocalDateTime createdAt;
    List<GoodsReceiptItemResponse> items;

    // Tổng kết
    Integer totalReceived;
    Integer totalPassed;
    Integer totalFailed;
}