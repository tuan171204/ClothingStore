package com.example.clothingstore.dtos.inventory.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * INV-004: Cập nhật ngưỡng cảnh báo tồn kho thấp cho 1 SKU.
 * Đặt threshold = 0 để tắt cảnh báo.
 */
@Data
public class UpdateLowStockThresholdRequest {
    @NotNull(message = "Ngưỡng cảnh báo không được để trống")
    @Min(value = 0, message = "Ngưỡng cảnh báo không được âm")
    private Integer threshold;
}