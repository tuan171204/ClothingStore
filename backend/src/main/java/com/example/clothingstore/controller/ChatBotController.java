package com.example.clothingstore.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux; // Import của Project Reactor

@Slf4j
@RestController
@RequestMapping("${api.prefix}/chat")
@RequiredArgsConstructor
public class ChatBotController {

    private final ChatClient chatClient;

    public record ChatRequest(String message, String conversationId) {}

    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> chatStream(@RequestBody ChatRequest request) {
        if (request.message() == null || request.message().trim().isEmpty()) {
            return Flux.just("Tin nhắn không được để trống.");
        }

        return chatClient.prompt()
                .user(request.message())
                .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, request.conversationId()))
                .stream()
                .content()

                // Bắt lỗi từ Groq và in ra chi tiết nguyên nhân
                .onErrorResume(throwable -> {
                    Throwable rootCause = throwable;

                    while (rootCause != null) {
                        if (rootCause instanceof org.springframework.web.reactive.function.client.WebClientResponseException ex) {
                            // 1. VẪN LƯU LOG CHI TIẾT CHO BẠN THEO DÕI
                            String errorBody = ex.getResponseBodyAsString();
                            log.error("=== API LỖI ===");
                            log.error("Mã lỗi: {}", ex.getStatusCode());
                            log.error("Chi tiết: {}", errorBody);
                            log.error("===============");

                            // 2. TRẢ VỀ CÂU TRẢ LỜI THÂN THIỆN CHO CLIENT
                            if (ex.getStatusCode().value() == 429) {
                                // Lỗi hết giới hạn (Rate Limit)
                                return Flux.just("\nXin lỗi bạn, hiện tại hệ thống tư vấn đang có quá nhiều người truy cập cùng lúc. Bạn vui lòng đợi khoảng 30 giây rồi hỏi lại mình nhé!");
                            } else {
                                // Các lỗi API khác từ Groq (400, 500)
                                return Flux.just("\nXin lỗi bạn, hệ thống AI hiện đang được bảo trì hoặc quá tải. Vui lòng quay lại sau ít phút nhé!");
                            }
                        }
                        rootCause = rootCause.getCause(); // Đi xuống lớp lỗi tiếp theo
                    }

                    // 3. XỬ LÝ LỖI HỆ THỐNG NỘI BỘ (Mất mạng, đứt kết nối...)
                    log.error("Lỗi hệ thống không xác định: ", throwable);
                    return Flux.just("\nDạ, kết nối mạng đang gặp chút gián đoạn. Bạn vui lòng thử lại sau nhé!");
                });
    }
}