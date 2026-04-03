package com.example.clothingstore.service.rabbitmq;

import com.example.clothingstore.config.RabbitMQConfig;
import com.example.clothingstore.dtos.event.OrderMessage;
import com.example.clothingstore.entity.Order;
import com.example.clothingstore.repository.OrderRepository;
import com.example.clothingstore.service.mail.MailService;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class OrderConsumer {

    private final OrderRepository orderRepository;
    private final MailService mailService;

    // Lắng nghe hàng đợi "order_email_queue"
    @RabbitListener(queues = RabbitMQConfig.ORDER_QUEUE)
    public void consumeMessage(OrderMessage message) {
        System.out.println("📩 [CONSUMER] Đã nhận tin nhắn từ RabbitMQ: " + message);

        try {
            Long orderId = message.getOrderId();

            // --- LOGIC MỚI: RETRY (Thử lại) nếu chưa thấy đơn hàng ---
            Order order = null;
            int retryCount = 0;
            int maxRetries = 3; // Thử tối đa 3 lần

            while (order == null && retryCount < maxRetries) {
                order = orderRepository.findById(orderId).orElse(null);

                if (order == null) {
                    System.out.println("⚠️ Chưa thấy đơn hàng trong DB, đang chờ Transaction commit... (Lần " + (retryCount + 1) + ")");
                    Thread.sleep(500); // Chờ 0.5 giây rồi thử lại
                    retryCount++;
                }
            }
            // ---------------------------------------------------------

            if (order == null) {
                throw new RuntimeException("Đã thử 3 lần vẫn không tìm thấy Order ID: " + orderId);
            }

            // Có đơn hàng rồi thì gửi mail
            System.out.println("✅ Đã tìm thấy đơn hàng, đang chuẩn bị gửi mail...");

            String action = message.getMessage(); // "CONFIRM", "DELIVERED", hoặc "CANCELLED"
            switch (action) {
                case "DELIVERED":
                    mailService.sendOrderDeliveredEmail(order);
                    break;
                case "CANCELLED":
                    mailService.sendOrderCancelledEmail(order);
                    break;
                default:
                    mailService.sendOrderConfirmation(order);
                    break;
            }
            System.out.println("✅ [SUCCESS] Đã gửi mail thành công loại: " + action);

        } catch (Exception e) {
            System.err.println("❌ [ERROR] Lỗi xử lý: " + e.getMessage());
        }
    }
}