package com.example.clothingstore.controller;

import com.example.clothingstore.dtos.order.response.OrderResponse;
import com.example.clothingstore.dtos.payment.response.VnPayResponse;
import com.example.clothingstore.entity.Enum.OrderStatus;
import com.example.clothingstore.entity.Order;
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
            @RequestParam("amount") long amount, // fake params
            @RequestParam("orderId") Long orderId
    ) {
        try {
            OrderResponse orderResponse = orderService.getOrderById(orderId);

            if (orderResponse.getStatus() != OrderStatus.PENDING) {
                return ResponseEntity.badRequest().body("Đơn hàng không ở trạng thái chờ thanh toán");
            }

            // 2. Lấy số tiền CHÍNH XÁC từ Database
            long exactAmount = orderResponse.getTotalAmount().longValue();

            String paymentUrl = vnPayService.createPaymentUrl(request, exactAmount, "NCB", orderId);
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

            // 2. Nếu OK -> Cập nhật trạng thái đơn hàng
            try {
                Long orderId = Long.parseLong(txnRef);

                orderService.autoConfirmAndShip(orderId);
            } catch (NumberFormatException e) {
                System.err.println("Lỗi parse OrderID: " + e.getMessage());
            }
            return ResponseEntity.ok(response);
        } else {
            // Thanh toán thất bại hoặc Hủy
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }
}