package com.example.clothingstore.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux; // Import của Project Reactor

@RestController
@RequestMapping("${api.prefix}/chat")
@RequiredArgsConstructor
public class ChatBotController {

    private final ChatClient chatClient;

    public record ChatRequest(String message, String conversationId) {}

    // Bắt buộc set MediaType là TEXT_EVENT_STREAM_VALUE
    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> chatStream(@RequestBody ChatRequest request) {
        return chatClient.prompt()
                .user(request.message())
                .advisors(a -> a
                        .param(ChatMemory.CONVERSATION_ID, request.conversationId())
                )
                .stream() // Chuyển từ .call() sang .stream()
                .content(); // Trả về Flux<String> tự động đẩy từng token
    }
}