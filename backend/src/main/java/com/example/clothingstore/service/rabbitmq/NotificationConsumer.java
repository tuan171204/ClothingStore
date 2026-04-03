package com.example.clothingstore.service.rabbitmq;

import com.example.clothingstore.config.RabbitMQConfig;
import com.example.clothingstore.dtos.event.NotificationMessage;
import com.example.clothingstore.entity.Enum.NotificationType;
import com.example.clothingstore.service.impl.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationConsumer {

    private final NotificationService notificationService;

    @RabbitListener(queues = RabbitMQConfig.NOTIFICATION_QUEUE)
    public void consumeNotification(NotificationMessage message) {
        log.info("📩 [CONSUMER] Đã nhận Notification từ RabbitMQ: {}", message);

        try {
            NotificationType type = NotificationType.valueOf(message.getType());
            String title = "";

            // Tự động phân loại Title dựa theo Enum Type
            switch (type) {
                case NEW_ORDER:
                    title = "Đơn đặt hàng mới 🛒";
                    break;
                case LOW_STOCK:
                    title = "Cảnh báo Tồn kho ⚠️";
                    break;
                case NEW_RETURN_REQUEST:
                    title = "Yêu cầu hoàn trả mới 🔄";
                    break;
                case NEW_CANCEL_ORDER:
                    title = "Khách hàng vừa hủy đơn ❌";
                    break;
                default:
                    title = "Thông báo hệ thống";
            }

            // Gọi logic lưu DB + Đẩy WebSocket
            notificationService.sendAdminNotification(
                    title,
                    message.getMessage(),
                    type,
                    message.getReferenceId()
            );

            log.info("✅ [SUCCESS] Xử lý Notification thành công!");

        } catch (Exception e) {
            log.error("❌ [ERROR] Lỗi xử lý Notification: {}", e.getMessage());
        }
    }
}