package com.example.clothingstore.controller;

import com.example.clothingstore.dto.payment.response.VnPayResponse;
import com.example.clothingstore.entity.Enum.OrderStatus;
import com.example.clothingstore.service.impl.OrderService;
import com.example.clothingstore.service.impl.VnPayService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("${api.prefix}/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final VnPayService vnPayService;
    private final OrderService orderService;

    // API tạo link thanh toán (Test trước khi ghép vào Order)
    // GET http://localhost:8080/api/v1/payment/create-payment?amount=100000
    @GetMapping("/create-payment")
    public ResponseEntity<String> createPayment(
            HttpServletRequest request,
            @RequestParam("amount") long amount,
            @RequestParam("orderId") Long orderId
    ) {
        try {
            String paymentUrl = vnPayService.createPaymentUrl(request, amount, "NCB", orderId);
            return ResponseEntity.ok(paymentUrl);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Lỗi tạo thanh toán: " + e.getMessage());
        }
    }

    // API Xử lý Callback từ VNPay
    @GetMapping("/vn-pay-callback")
    public ResponseEntity<VnPayResponse> payCallbackHandler(HttpServletRequest request) {
        String status = request.getParameter("vnp_ResponseCode");
        String txnRef = request.getParameter("vnp_TxnRef"); // Lấy Order ID từ VNPay trả về
        if (status.equals("00")) {
            // 1. Verify chữ ký (Checksum) xem có đúng VNPay gửi không
            VnPayResponse response = vnPayService.handleVnPayCallback(request);

            if ("00".equals(response.getCode())) {
                // 2. Nếu OK -> Cập nhật trạng thái đơn hàng
                try {
                    Long orderId = Long.parseLong(txnRef);
                    orderService.updateOrderStatus(orderId, OrderStatus.CONFIRMED); // CONFIRMED = Đã thanh toán
                } catch (NumberFormatException e) {
                    System.err.println("Lỗi parse OrderID: " + e.getMessage());
                }
            }
            return ResponseEntity.ok(response);
        } else {
            // Thanh toán thất bại hoặc Hủy
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }
}