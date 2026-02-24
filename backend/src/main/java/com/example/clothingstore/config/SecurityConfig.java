package com.example.clothingstore.config;

import com.example.clothingstore.config.auth.CustomJwtDecoder;
import com.example.clothingstore.config.auth.JwtAuthenticationEntryPoint;
import org.springframework.beans.factory.annotation.Autowired;
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

    private final String[] PUBLIC_ENDPOINTS = {
            "/users/registration",
            "/auth/token",
            "/auth/introspect",
            "/auth/logout",
            "/auth/refresh",
    };

    @Autowired
    private CustomJwtDecoder customJwtDecoder;


    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception{
        http
            // 1. Tắt CSRF (Cross-Site Request Forgery) vì chúng ta giao tiếp qua API stateless
            .csrf(AbstractHttpConfigurer::disable)
            .cors(Customizer.withDefaults())

            // 2. Cấu hình quyền truy cập
            .authorizeHttpRequests(auth -> auth
                    .requestMatchers("/**").permitAll()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                    .jwt(jwtConfigurer -> jwtConfigurer.decoder(customJwtDecoder))
                    .authenticationEntryPoint(new JwtAuthenticationEntryPoint()) // Xử lý lỗi 401
            );;

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
