package com.example.clothingstore.config;

import com.example.clothingstore.config.auth.CustomJwtDecoder;
import com.example.clothingstore.config.auth.JwtAuthenticationEntryPoint;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Value("${api.prefix}")
    private String apiPrefix;

    private final String[] PUBLIC_ENDPOINTS = {
            "/users/registration",
            "/auth/token",
            "/auth/introspect",
            "/auth/logout",
            "/auth/refresh",
            "/auth/forgot-password",
            "/auth/reset-password",
    };

    @Autowired
    private CustomJwtDecoder customJwtDecoder;


    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception{
        http
            // 1. Tắt CSRF (Cross-Site Request Forgery) vì chúng ta giao tiếp qua API stateless
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // 2. Cấu hình quyền truy cập
            .authorizeHttpRequests(auth -> auth
                    .requestMatchers("/**").permitAll()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                    .jwt(jwtConfigurer -> jwtConfigurer
                            .decoder(customJwtDecoder)
                            .jwtAuthenticationConverter(jwtAuthenticationConverter()))

                    .authenticationEntryPoint(new JwtAuthenticationEntryPoint()) // Xử lý lỗi 401
            );;

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:3000"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter(){
        JwtGrantedAuthoritiesConverter jwtGrantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
        // Thêm tiền tố ROLE_ vào trước các quyền lấy từ token
        jwtGrantedAuthoritiesConverter.setAuthorityPrefix("ROLE_");
        // Chỉ định claim nào trong JWT chứa thông tin Role (ở Bước 1 ta dùng "scope")
        jwtGrantedAuthoritiesConverter.setAuthoritiesClaimName("scope");

        JwtAuthenticationConverter jwtAuthenticationConverter = new JwtAuthenticationConverter();
        jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(jwtGrantedAuthoritiesConverter);
        return jwtAuthenticationConverter;
    }
}
