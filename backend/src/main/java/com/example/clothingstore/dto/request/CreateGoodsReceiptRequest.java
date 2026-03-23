// ======== CreateGoodsReceiptRequest.java ========
package com.example.clothingstore.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/**
 * INV-002 + INV-003: Request tạo phiếu nhập kho.
 * quantityPassed + quantityFailed phải = quantityReceived (validated ở Service).
 */
@Data
public class CreateGoodsReceiptRequest {

    private String note;

    @NotNull(message = "Danh sách hàng nhập không được để trống")
    @Size(min = 1, message = "Phiếu nhập phải có ít nhất 1 mặt hàng")
    @Valid
    private List<GrnItemRequest> items;

    @Data
    public static class GrnItemRequest {

        @NotNull(message = "SKU ID không được để trống")
        private Long skuId;

        @NotNull(message = "Số lượng nhận không được để trống")
        @Min(value = 1, message = "Số lượng nhận phải lớn hơn 0")
        private Integer quantityReceived;

        @NotNull(message = "Số lượng đạt QC không được để trống")
        @Min(value = 0, message = "Số lượng đạt QC không được âm")
        private Integer quantityPassed;

        @NotNull(message = "Số lượng lỗi QC không được để trống")
        @Min(value = 0, message = "Số lượng lỗi QC không được âm")
        private Integer quantityFailed;
    }
}