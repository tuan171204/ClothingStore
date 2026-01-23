package com.example.clothingstore.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception{
        http
            // 1. Tắt CSRF (Cross-Site Request Forgery) vì chúng ta giao tiếp qua API stateless
            .csrf(AbstractHttpConfigurer::disable)

            // 2. Cấu hình quyền truy cập
            .authorizeHttpRequests(auth -> auth
                    // Cho phép tất cả mọi người truy cập vào các API bắt đầu bằng /api/v1/products/**
                    // Đây là nơi chứa API lấy danh sách sp, chi tiết sp mà khách không cần login cũng xem được
                    .requestMatchers("/api/v1/products/**").permitAll()

                    // Các request khác (sau này làm Admin) thì mới cần xác thực
                    .anyRequest().authenticated()
            );
        return http.build();
    }
}
