package com.example.clothingstore.dto.payment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class VnPayResponse {
    public String code;       // Mã lỗi (00 là thành công)
    public String message;    // Thông báo (Giao dịch thành công/thất bại)
    public String paymentUrl; // Đường dẫn thanh toán (nếu có)
}