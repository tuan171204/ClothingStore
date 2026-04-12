package com.example.clothingstore.service.rabbitmq;

import com.example.clothingstore.config.RabbitMQConfig;
import com.example.clothingstore.dtos.event.NotificationMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationProducer {

    private final RabbitTemplate rabbitTemplate;

    public void sendAdminNotification(String type, String referenceId, String message) {
        NotificationMessage notifMsg = new NotificationMessage(type, referenceId, message);

        // Đăng ký một hook để đẩy message đi SAU KHI MySQL đã commit hoàn tất
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    log.info("🐇 [PRODUCER] (After Commit) Đang gửi Notification vào RabbitMQ: {}", notifMsg);
                    rabbitTemplate.convertAndSend(
                            RabbitMQConfig.NOTIFICATION_EXCHANGE,
                            RabbitMQConfig.NOTIFICATION_ROUTING_KEY,
                            notifMsg
                    );
                }
            });
        } else {
            // Trường hợp hàm gọi không nằm trong @Transactional
            log.info("🐇 [PRODUCER] Đang gửi Notification ngay lập tức: {}", notifMsg);
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.NOTIFICATION_EXCHANGE,
                    RabbitMQConfig.NOTIFICATION_ROUTING_KEY,
                    notifMsg
            );
        }
    }
}