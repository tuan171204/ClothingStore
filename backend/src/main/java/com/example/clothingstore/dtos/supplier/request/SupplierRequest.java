// ============================================================
// SupplierRequest.java
// ============================================================
package com.example.clothingstore.dtos.supplier.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * DTO tạo mới / cập nhật Nhà cung cấp.
 * Sử dụng Java 17 Record để bất biến (immutable) và gọn hơn class thông thường.
 */
public record SupplierRequest(

        @NotBlank(message = "Tên nhà cung cấp không được để trống")
        @Size(min = 2, max = 200, message = "Tên nhà cung cấp phải từ 2 đến 200 ký tự")
        String name,

        @Size(max = 100, message = "Tên người liên hệ không vượt quá 100 ký tự")
        String contactPerson,

        @Pattern(regexp = "^(\\+84|0)[0-9]{9,10}$", message = "Số điện thoại không hợp lệ")
        String phone,

        @Email(message = "Email không hợp lệ")
        @Size(max = 150)
        String email,

        String address,

        @Pattern(regexp = "^[0-9]{10,13}$", message = "Mã số thuế phải là 10–13 chữ số")
        String taxCode,

        Boolean isActive
) {
    // Compact constructor - chuẩn hóa isActive nếu null
    public SupplierRequest {
        if (isActive == null) isActive = true;
    }
}