package com.example.clothingstore.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${api.prefix}")
    private String apiPrefix;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception{
        http
            // 1. Tắt CSRF (Cross-Site Request Forgery) vì chúng ta giao tiếp qua API stateless
            .csrf(AbstractHttpConfigurer::disable)
            .cors(Customizer.withDefaults())

            // 2. Cấu hình quyền truy cập
            .authorizeHttpRequests(auth -> auth
                    // Cho phép tất cả mọi người truy cập vào các API bắt đầu bằng /api/v1/products/**
                    // Đây là nơi chứa API lấy danh sách sp, chi tiết sp mà khách không cần login cũng xem được
                    .requestMatchers(
                            String.format("%s/products/**", apiPrefix), // /api/v1/products/**
                            String.format("%s/products/upload-image", apiPrefix) // Cấp quyền cụ thể cho upload
                    )
                    .permitAll()
                    // Các request khác (sau này làm Admin) thì mới cần xác thực
                    .anyRequest().authenticated()
            );
        return http.build();
    }

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.setAllowedOrigins(List.of("http://localhost:3000")); // Cho phép Next.js
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(Arrays.asList("*"));
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}
