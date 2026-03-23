// ======== StockAdjustmentRequest.java ========
package com.example.clothingstore.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * INV-005: Request điều chỉnh tồn kho thủ công.
 * quantityChange > 0: nhập thêm. quantityChange < 0: xuất bớt.
 */
@Data
public class StockAdjustmentRequest {

    @NotNull(message = "SKU ID không được để trống")
    private Long skuId;

    @NotNull(message = "Số lượng điều chỉnh không được để trống")
    private Integer quantityChange;

    @NotBlank(message = "Lý do điều chỉnh không được để trống")
    private String reason;
}