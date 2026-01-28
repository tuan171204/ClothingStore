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

    public static final String QUEUE_NAME = "order_email_queue";
    public static final String EXCHANGE_NAME = "order_exchange";
    public static final String ROUTING_KEY = "order_routing_key";

    // 1. Tạo Queue
    @Bean
    public Queue queue() {
        return new Queue(QUEUE_NAME, true); // true = Bền vững (không mất khi tắt RabbitMQ)
    }

    // 2. Tạo Exchange
    @Bean
    public DirectExchange exchange() {
        return new DirectExchange(EXCHANGE_NAME);
    }

    // 3. Nối Queue vào Exchange
    @Bean
    public Binding binding(Queue queue, DirectExchange exchange) {
        return BindingBuilder.bind(queue).to(exchange).with(ROUTING_KEY);
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

//    @Bean
//    public ApplicationRunner runner(ConnectionFactory cf) {
//        return args -> {
//            try {
//                // Thử tạo kết nối thực tế
//                cf.createConnection().close();
//                System.out.println("=================================================");
//                System.out.println("✅ KẾT NỐI RABBITMQ THÀNH CÔNG! (RabbitMQ is UP)");
//                System.out.println("=================================================");
//            } catch (Exception e) {
//                System.err.println("=================================================");
//                System.err.println("❌ KẾT NỐI RABBITMQ THẤT BẠI! Lỗi: " + e.getMessage());
//                System.err.println("Kiểm tra lại: Docker đã chạy chưa? Port 5672 có mở không?");
//                System.err.println("=================================================");
//            }
//        };
//    }

    // Ép RabbitAdmin phải khởi tạo ngay lập tức
    @Bean
    public RabbitAdmin rabbitAdmin(ConnectionFactory connectionFactory) {
        RabbitAdmin admin = new RabbitAdmin(connectionFactory);
        admin.setAutoStartup(true);
        return admin;
    }
}