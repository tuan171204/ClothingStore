package com.example.clothingstore.config;

import jakarta.servlet.http.HttpServletRequest;
import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Configuration
@Data
public class VnPayConfig {
    @Value("${payment.vnpay.url}")
    private String vnp_PayUrl;

    @Value("${payment.vnpay.return-url}")
    private String vnp_ReturnUrl;

    @Value("${payment.vnpay.tmn-code}")
    private String vnp_TmnCode;

    @Value("${payment.vnpay.secret-key}")
    private String secretKey;

    @Value("${api.prefix}/payment/vnpay-callback") // URL API Backend xử lý IPN (tính sau)
    private String vnp_ApiUrl;

    // Hàm tiện ích: Mã hóa HMAC SHA512
    public  String hmacSHA512(String data) {
        try {
            if (this.secretKey == null || data == null) {
                return null;
            }
            Mac hmac512 = Mac.getInstance("HmacSHA512");
            byte[] hmacKeyBytes = this.secretKey.getBytes();
            SecretKeySpec secretKey = new SecretKeySpec(hmacKeyBytes, "HmacSHA512");
            hmac512.init(secretKey);
            byte[] dataBytes = data.getBytes(StandardCharsets.UTF_8);
            byte[] result = hmac512.doFinal(dataBytes);
            StringBuilder sb = new StringBuilder(2 * result.length);
            for (byte b : result) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (Exception ex) {
            return "";
        }
    }

    // Hàm tiện ích: Lấy IP người dùng (VNPay yêu cầu gửi IP)
    public static String getIpAddress(HttpServletRequest request) {
        String ipAdress;
        try {
            ipAdress = request.getHeader("X-FORWARDED-FOR");
            if (ipAdress == null) {
                ipAdress = request.getRemoteAddr();
            }
        } catch (Exception e) {
            ipAdress = "Invalid IP";
        }
        return ipAdress;
    }

    // Hàm tiện ích: Random chuỗi số ngẫu nhiên (để làm mã giao dịch)
    public static String getRandomNumber(int len) {
        Random rnd = new Random();
        String chars = "0123456789";
        StringBuilder sb = new StringBuilder(len);
        for (int i = 0; i < len; i++) {
            sb.append(chars.charAt(rnd.nextInt(chars.length())));
        }
        return sb.toString();
    }
}