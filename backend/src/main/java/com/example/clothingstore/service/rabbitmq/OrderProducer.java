package com.example.clothingstore.service.rabbitmq;

import com.example.clothingstore.config.RabbitMQConfig;
import com.example.clothingstore.dtos.event.OrderMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class OrderProducer {

    private final RabbitTemplate rabbitTemplate;

    public void sendOrderConfirmation(Long orderId) {
        OrderMessage message = new OrderMessage(orderId, "Please send email for Order #" + orderId);

        System.out.println("🐇 [PRODUCER] Đang gửi tin nhắn vào RabbitMQ: " + message);

        // Gửi tin nhắn vào Exchange, kèm theo Routing Key
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.EXCHANGE_NAME,
                RabbitMQConfig.ROUTING_KEY,
                message
        );
    }

    public void sendOrderDelivered(Long orderId) {
        OrderMessage message = new OrderMessage(orderId, "DELIVERED");
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, RabbitMQConfig.ROUTING_KEY, message);
    }

    public void sendOrderCancelled(Long orderId) {
        OrderMessage message = new OrderMessage(orderId, "CANCELLED");
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, RabbitMQConfig.ROUTING_KEY, message);
    }
}