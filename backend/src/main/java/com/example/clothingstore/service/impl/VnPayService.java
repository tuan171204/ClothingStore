package com.example.clothingstore.service.impl;

import com.example.clothingstore.config.VnPayConfig;
import com.example.clothingstore.dto.payment.VnPayResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@Service
@RequiredArgsConstructor
public class VnPayService {

    private final VnPayConfig vnPayConfig;

    public String createPaymentUrl(HttpServletRequest request, long amount, String bankCode, Long orderId) throws UnsupportedEncodingException {
        String vnp_Version = "2.1.0";
        String vnp_Command = "pay";
        String orderType = "other";

        long amountVal = amount * 100;

        // Các hàm tiện ích này là static nên giữ nguyên cách gọi VnPayConfig...
        String vnp_TxnRef = String.valueOf(orderId);
        String vnp_IpAddr = VnPayConfig.getIpAddress(request);

        // SỬA LỖI Ở ĐÂY: Dùng biến vnPayConfig (chữ thường) để gọi Getter
        String vnp_TmnCode = vnPayConfig.getVnp_TmnCode();

        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", vnp_Version);
        vnp_Params.put("vnp_Command", vnp_Command);
        vnp_Params.put("vnp_TmnCode", vnp_TmnCode);
        vnp_Params.put("vnp_Amount", String.valueOf(amountVal));
        vnp_Params.put("vnp_CurrCode", "VND");

        if (bankCode != null && !bankCode.isEmpty()) {
            vnp_Params.put("vnp_BankCode", bankCode);
        }

        vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
        vnp_Params.put("vnp_OrderInfo", "Thanh toan don hang:" + vnp_TxnRef);
        vnp_Params.put("vnp_OrderType", orderType);
        vnp_Params.put("vnp_Locale", "vn");

        // SỬA LỖI Ở ĐÂY: Dùng Getter thay vì gọi trực tiếp biến private
        vnp_Params.put("vnp_ReturnUrl", vnPayConfig.getVnp_ReturnUrl());

        vnp_Params.put("vnp_IpAddr", vnp_IpAddr);

        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        String vnp_CreateDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_CreateDate", vnp_CreateDate);

        cld.add(Calendar.MINUTE, 15);
        String vnp_ExpireDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_ExpireDate", vnp_ExpireDate);

        List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();

        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = vnp_Params.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII.toString()));
                query.append('=');
                query.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                if (itr.hasNext()) {
                    query.append('&');
                    hashData.append('&');
                }
            }
        }

        String queryUrl = query.toString();

        // SỬA LỖI Ở ĐÂY: Gọi hàm hash từ instance
        String vnp_SecureHash = vnPayConfig.hmacSHA512(hashData.toString());

        queryUrl += "&vnp_SecureHash=" + vnp_SecureHash;

        // SỬA LỖI: Chỉ giữ lại 1 dòng return đúng cú pháp
        return vnPayConfig.getVnp_PayUrl() + "?" + queryUrl;
    }


    public VnPayResponse handleVnPayCallback(HttpServletRequest request) {
        try {
            Map fields = new HashMap();
            for (Enumeration params = request.getParameterNames(); params.hasMoreElements(); ) {
                String fieldName = (String) params.nextElement();
                String fieldValue = request.getParameter(fieldName);
                if ((fieldValue != null) && (fieldValue.length() > 0)) {
                    fields.put(fieldName, fieldValue);
                }
            }

            String vnp_SecureHash = request.getParameter("vnp_SecureHash");

            // Xóa 2 tham số hash này đi để tính toán lại checksum (vì lúc gửi đi không có chúng)
            if (fields.containsKey("vnp_SecureHashType")) {
                fields.remove("vnp_SecureHashType");
            }
            if (fields.containsKey("vnp_SecureHash")) {
                fields.remove("vnp_SecureHash");
            }

            // Sắp xếp tham số a-z (Bắt buộc theo chuẩn VNPay)
            List fieldNames = new ArrayList(fields.keySet());
            Collections.sort(fieldNames);

            StringBuilder hashData = new StringBuilder();
            Iterator itr = fieldNames.iterator();
            while (itr.hasNext()) {
                String fieldName = (String) itr.next();
                String fieldValue = (String) fields.get(fieldName);
                if ((fieldValue != null) && (fieldValue.length() > 0)) {
                    // Build hash data
                    hashData.append(fieldName);
                    hashData.append('=');
                    hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                    if (itr.hasNext()) {
                        hashData.append('&');
                    }
                }
            }

            // Tính lại chữ ký dựa trên secret key của mình
            String signValue = vnPayConfig.hmacSHA512(hashData.toString());

            // 1. So sánh chữ ký của mình tính ra vs chữ ký VNPay gửi về
            if (signValue.equals(vnp_SecureHash)) {
                // Chữ ký khớp -> Dữ liệu toàn vẹn

                // 2. Kiểm tra trạng thái giao dịch (00 là thành công)
                if ("00".equals(request.getParameter("vnp_ResponseCode"))) {
                    return VnPayResponse.builder()
                            .code("00")
                            .message("Giao dịch thành công")
                            .paymentUrl("")
                            .build();
                } else {
                    return VnPayResponse.builder()
                            .code("02")
                            .message("Giao dịch thất bại") // Ví dụ: Khách hủy, hết tiền...
                            .paymentUrl("")
                            .build();
                }
            } else {
                // Chữ ký không khớp -> Có thể bị hacker sửa đổi URL
                return VnPayResponse.builder()
                        .code("97")
                        .message("Chữ ký không hợp lệ (Checksum failed)")
                        .paymentUrl("")
                        .build();
            }
        } catch (Exception e) {
            return VnPayResponse.builder()
                    .code("99")
                    .message("Lỗi không xác định: " + e.getMessage())
                    .paymentUrl("")
                    .build();
        }
    }
}