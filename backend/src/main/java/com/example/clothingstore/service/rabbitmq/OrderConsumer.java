package com.example.clothingstore.service.rabbitmq;

import com.example.clothingstore.config.RabbitMQConfig;
import com.example.clothingstore.dtos.event.OrderMessage;
import com.example.clothingstore.entity.Order;
import com.example.clothingstore.repository.OrderRepository;
import com.example.clothingstore.service.mail.MailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Lazy(false)
@Slf4j
public class OrderConsumer {

    private final OrderRepository orderRepository;
    private final MailService mailService;

    // Lắng nghe hàng đợi "order_email_queue"
    @RabbitListener(queues = RabbitMQConfig.ORDER_QUEUE)
    public void consumeMessage(OrderMessage message) {
        log.info("📩 [CONSUMER] Đã nhận tin nhắn Order từ RabbitMQ: {}", message);

        try {
            Long orderId = message.getOrderId();

            // Producer đã đảm bảo gửi sau khi DB commit, KHÔNG cần Thread.sleep() nữa
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy Order ID: " + orderId));

            log.info("✅ Đã tìm thấy đơn hàng {}, đang chuẩn bị gửi mail...", orderId);

            String action = message.getMessage();
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
            log.info("✅ [SUCCESS] Đã gửi mail thành công loại: {}", action);

        } catch (Exception e) {
            log.error("❌ [ERROR] Lỗi xử lý OrderConsumer: {}", e.getMessage());
        }
    }
}