package com.example.clothingstore.controller;

import com.example.clothingstore.entity.Order;
import com.example.clothingstore.entity.OrderStatus;
import com.example.clothingstore.repository.OrderRepository;
import com.example.clothingstore.service.mail.MailService; // Hoặc Producer nếu muốn gửi mail
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/webhook")
@RequiredArgsConstructor
public class WebhookController {

    private final OrderRepository orderRepository;
    // private final OrderProducer orderProducer; // Uncomment nếu muốn gửi mail

    @PostMapping("/ghn")
    public ResponseEntity<String> handleGhnWebhook(@RequestBody JsonNode payload) {
        System.out.println("🔔 [WEBHOOK] Nhận tín hiệu từ GHN: " + payload);

        try {
            String orderCode = payload.get("OrderCode").asText();
            String status = payload.get("Status").asText(); // Vd: "delivered", "picking", "return"

            // 1. Tìm đơn hàng trong DB bằng Tracking Code
            Optional<Order> orderOpt = orderRepository.findByTrackingCode(orderCode);

            if (orderOpt.isPresent()) {
                Order order = orderOpt.get();

                // 2. Cập nhật trạng thái
                switch (status.toLowerCase()) {
                    case "picking": // Đang lấy hàng
                        // order.setStatus(OrderStatus.SHIPPING); // Đã set lúc tạo rồi
                        break;
                    case "delivered": // Giao thành công
                        order.setStatus(OrderStatus.COMPLETED);
                        System.out.println("✅ Đơn hàng " + order.getId() + " đã giao thành công!");
                        // orderProducer.sendOrderCompletedEmail(order.getId()); // Gửi mail cảm ơn
                        break;
                    case "cancel": // Hủy
                        order.setStatus(OrderStatus.CANCELLED);
                        break;
                    case "return": // Trả hàng
                        order.setStatus(OrderStatus.CANCELLED); // Hoặc trạng thái RETURNED
                        break;
                }
                orderRepository.save(order);
            } else {
                System.out.println("⚠️ Không tìm thấy đơn hàng với mã vận đơn: " + orderCode);
            }

        } catch (Exception e) {
            System.err.println("Lỗi xử lý Webhook: " + e.getMessage());
        }

        return ResponseEntity.ok("Received");
    }
}