package com.example.clothingstore.controller;

import com.example.clothingstore.dtos.ApiResponse;
import com.example.clothingstore.service.chatbot.VectorSyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("${api.prefix}/admin/vector")
@RequiredArgsConstructor
public class AdminVectorController {

    private final VectorSyncService vectorSyncService;

    @PostMapping("/sync")
    public ApiResponse<String> syncData() {
        vectorSyncService.syncProductsToPinecone();
        return ApiResponse.<String>builder()
                .result("Tiến trình đồng bộ Vector đang chạy. Vui lòng kiểm tra log hệ thống.")
                .build();
    }
}