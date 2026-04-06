package com.example.clothingstore.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String ORDER_QUEUE = "order_email_queue";
    public static final String ORDER_EXCHANGE = "order_exchange";
    public static final String ORDER_ROUTING_KEY = "order_routing_key";

    // 1. Tạo Queue
    @Bean
    public Queue queue() {
        return new Queue(ORDER_QUEUE, true); // true = Bền vững (không mất khi tắt RabbitMQ)
    }

    // 2. Tạo Exchange
    @Bean
    public DirectExchange exchange() {
        return new DirectExchange(ORDER_EXCHANGE);
    }

    // 3. Nối Queue vào Exchange
    @Bean
    public Binding binding(Queue queue, DirectExchange exchange) {
        return BindingBuilder.bind(queue).to(exchange).with(ORDER_ROUTING_KEY);
    }

    // 4. Config gửi Json
    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter());
        return template;
    }

    // Ép RabbitAdmin phải khởi tạo ngay lập tức
    @Bean
    public RabbitAdmin rabbitAdmin(ConnectionFactory connectionFactory) {
        RabbitAdmin admin = new RabbitAdmin(connectionFactory);
        admin.setAutoStartup(true);
        return admin;
    }

    // ════════════════════════════════════════════════════════════════
    // --- CẤU HÌNH NOTIFICATION ---
    // ════════════════════════════════════════════════════════════════
    public static final String NOTIFICATION_QUEUE = "notification_queue";
    public static final String NOTIFICATION_EXCHANGE = "notification_exchange";
    public static final String NOTIFICATION_ROUTING_KEY = "notification_routing_key";

    @Bean
    public Queue notificationQueue() {
        return new Queue(NOTIFICATION_QUEUE, true);
    }

    @Bean
    public DirectExchange notificationExchange() {
        return new DirectExchange(NOTIFICATION_EXCHANGE);
    }

    @Bean
    public Binding notificationBinding() {
        return BindingBuilder.bind(notificationQueue())
                .to(notificationExchange())
                .with(NOTIFICATION_ROUTING_KEY);
    }

    // ════════════════════════════════════════════════════════════════
    // --- CẤU HÌNH FLASH SALES ---
    // ════════════════════════════════════════════════════════════════
    public static final String FS_SYNC_QUEUE = "flash_sale_sync_queue";
    public static final String FS_SYNC_EXCHANGE = "flash_sale_sync_exchange";
    public static final String FS_SYNC_ROUTING_KEY = "flash_sale_sync_routing_key";

    @Bean
    public Queue fsSyncQueue() { return new Queue(FS_SYNC_QUEUE, true); }

    @Bean
    public DirectExchange fsSyncExchange() { return new DirectExchange(FS_SYNC_EXCHANGE); }

    @Bean
    public Binding fsSyncBinding() {
        return BindingBuilder.bind(fsSyncQueue()).to(fsSyncExchange()).with(FS_SYNC_ROUTING_KEY);
    }
}