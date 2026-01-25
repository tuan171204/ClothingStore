package com.example.clothingstore.controller;

import com.example.clothingstore.dto.payment.VnPayResponse;
import com.example.clothingstore.service.VnPayService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("${api.prefix}/payment")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class PaymentController {

    private final VnPayService vnPayService;

    // API tạo link thanh toán (Test trước khi ghép vào Order)
    // GET http://localhost:8080/api/v1/payment/create-payment?amount=100000
    @GetMapping("/create-payment")
    public ResponseEntity<String> createPayment(
            HttpServletRequest request,
            @RequestParam("amount") long amount
    ) throws Exception {
        // Tạm thời hardcode phí vận chuyển trong đầu là 30k
        // Tổng tiền = amount + 30000 (Ví dụ vậy, hoặc FE gửi tổng sang)

        String paymentUrl = vnPayService.createPaymentUrl(request, amount, null);
        return ResponseEntity.ok(paymentUrl);
    }

    // API Xử lý Callback từ VNPay
    @GetMapping("/vn-pay-callback")
    public ResponseEntity<VnPayResponse> payCallbackHandler(HttpServletRequest request) {
        String status = request.getParameter("vnp_ResponseCode");
        if (status.equals("00")) {
            return ResponseEntity.ok(vnPayService.handleVnPayCallback(request));
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }
}