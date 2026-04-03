package com.example.clothingstore.dtos.order.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/**
 * Request body cho API yêu cầu hoàn trả đơn hàng từ phía khách hàng.
 */
@Data
public class ReturnOrderRequest {

    /**
     * Lý do ngắn gọn (dropdown value từ FE).
     * Các giá trị hợp lệ: DEFECTIVE, WRONG_ITEM, NOT_AS_DESCRIBED, CHANGED_MIND, OTHER
     */
    @NotBlank(message = "Lý do hoàn trả không được để trống")
    private String reason;

    /**
     * Mô tả chi tiết từ khách hàng.
     */
    @NotBlank(message = "Mô tả chi tiết không được để trống")
    @Size(min = 10, max = 1000, message = "Mô tả phải từ 10 đến 1000 ký tự")
    private String description;

    /**
     * Danh sách URL ảnh bằng chứng đã upload lên Cloudinary.
     * Tối thiểu 1 ảnh, tối đa 5 ảnh.
     */
    @Size(min = 1, max = 5, message = "Cần cung cấp từ 1 đến 5 ảnh bằng chứng")
    private List<String> imageUrls;
}