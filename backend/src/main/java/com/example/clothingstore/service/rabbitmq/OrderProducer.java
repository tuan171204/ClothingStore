package com.example.clothingstore.service.rabbitmq;

import com.example.clothingstore.config.RabbitMQConfig;
import com.example.clothingstore.dtos.event.OrderMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderProducer {

    private final RabbitTemplate rabbitTemplate;

    public void sendOrderConfirmation(Long orderId) {
        OrderMessage message = new OrderMessage(orderId, "Please send email for Order #" + orderId);
        sendMessageAfterCommit(message);
    }

    public void sendOrderDelivered(Long orderId) {
        OrderMessage message = new OrderMessage(orderId, "DELIVERED");
        sendMessageAfterCommit(message);
    }

    public void sendOrderCancelled(Long orderId) {
        OrderMessage message = new OrderMessage(orderId, "CANCELLED");
        sendMessageAfterCommit(message);
    }

    // Hàm dùng chung để xử lý hook sau khi commit DB
    private void sendMessageAfterCommit(OrderMessage message) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    log.info("🐇 [PRODUCER] (After Commit) Đang gửi tin nhắn Order vào RabbitMQ: {}", message);
                    rabbitTemplate.convertAndSend(
                            RabbitMQConfig.ORDER_EXCHANGE,
                            RabbitMQConfig.ORDER_ROUTING_KEY,
                            message
                    );
                }
            });
        } else {
            log.info("🐇 [PRODUCER] Đang gửi tin nhắn Order ngay lập tức: {}", message);
            rabbitTemplate.convertAndSend(RabbitMQConfig.ORDER_EXCHANGE, RabbitMQConfig.ORDER_ROUTING_KEY, message);
        }
    }
}