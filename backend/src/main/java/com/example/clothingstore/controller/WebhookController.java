package com.example.clothingstore.controller;

import com.example.clothingstore.dtos.webhook.GhnWebhookPayload;
import com.example.clothingstore.service.impl.GhnWebhookService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller nhận Webhook callback từ GHN (Giao Hàng Nhanh).
 *
 * Endpoint: POST /api/webhook/ghn
 *
 * Lưu ý bảo mật:
 *  - Endpoint này phải được EXCLUDE khỏi Spring Security JWT filter
 *    (GHN gọi không có Authorization header).
 *  - Validation ShopID được thực hiện trong GhnWebhookService để đảm bảo
 *    chỉ chấp nhận request từ đúng shop.
 *
 * Quy tắc GHN Retry:
 *  - GHN mong đợi HTTP 200. Nếu nhận 4xx/5xx, GHN sẽ retry tối đa 10 lần,
 *    mỗi lần cách nhau 5 giây.
 *  - Do đó controller LUÔN trả về 200, dù có lỗi nghiệp vụ nội bộ.
 *    Lỗi được log và xử lý trong service, không throw ra ngoài.
 */
@Slf4j
@RestController
@RequestMapping("/api/webhook")
@RequiredArgsConstructor
public class WebhookController {

    private final GhnWebhookService ghnWebhookService;

    /**
     * Nhận webhook từ GHN.
     *
     * Luôn trả về 200 OK — xem javadoc class.
     */
    @PostMapping("/ghn")
    public ResponseEntity<String> handleGhnWebhook(@RequestBody GhnWebhookPayload payload) {
        log.debug("[WebhookController] Nhận GHN webhook: type={}, orderCode={}",
                payload.getType(), payload.getOrderCode());
        try {
            ghnWebhookService.handle(payload);
        } catch (Exception e) {
            // Log lỗi nhưng vẫn trả 200 để GHN không retry vô ích
            log.error("[WebhookController] Lỗi xử lý webhook GHN (đã catch): {}", e.getMessage(), e);
        }
        return ResponseEntity.ok("Received");
    }
}