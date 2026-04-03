package com.example.clothingstore.config.websocket;

import com.example.clothingstore.config.auth.CustomJwtDecoder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketJwtInterceptor implements ChannelInterceptor {

    private final CustomJwtDecoder customJwtDecoder;
    private final JwtAuthenticationConverter jwtAuthenticationConverter;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        // Chỉ kiểm tra JWT khi Client bắt đầu yêu cầu CONNECT vào WebSocket
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authorizationHeader = accessor.getFirstNativeHeader("Authorization");

            if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
                String token = authorizationHeader.substring(7);
                try {
                    // Dùng CustomJwtDecoder (gọi API introspect) để decode và validate token
                    Jwt jwt = customJwtDecoder.decode(token);

                    // Dùng Converter đã cấu hình trong SecurityConfig để lấy Role (Scope) ra
                    Authentication authentication = jwtAuthenticationConverter.convert(jwt);

                    // Nạp thông tin User vào session của WebSocket
                    accessor.setUser(authentication);

                } catch (Exception e) {
                    log.error("Lỗi xác thực JWT trên WebSocket: {}", e.getMessage());
                    throw new IllegalArgumentException("Token không hợp lệ hoặc đã bị vô hiệu hóa");
                }
            } else {
                throw new IllegalArgumentException("Không tìm thấy JWT Token trong STOMP Header");
            }
        }
        return message;
    }
}