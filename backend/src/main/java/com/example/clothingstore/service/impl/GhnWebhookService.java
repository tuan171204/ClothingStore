package com.example.clothingstore.service.impl;

import com.example.clothingstore.config.GhnConfig;
import com.example.clothingstore.dtos.webhook.GhnWebhookPayload;
import com.example.clothingstore.entity.Enum.GhnStatus;
import com.example.clothingstore.entity.Order;
import com.example.clothingstore.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service xử lý toàn bộ business logic khi nhận webhook từ GHN.
 *
 * Nguyên tắc thiết kế:
 *  1. Idempotent — mỗi webhook chỉ xử lý 1 lần dựa trên (orderCode + status + time).
 *  2. Always respond 200 — log lỗi nội bộ, KHÔNG throw ra ngoài để tránh GHN retry vô ích.
 *  3. Validate ShopID — reject payload không thuộc shop của mình.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GhnWebhookService {

    private final OrderRepository orderRepository;
    private final GhnConfig ghnConfig;

    // ----------------------------------------------------------------
    // Entry point — gọi từ WebhookController
    // ----------------------------------------------------------------

    /**
     * Xử lý một webhook payload từ GHN.
     *
     * @param payload DTO đã được deserialise từ JSON body
     */
    public void handle(GhnWebhookPayload payload) {

        // 1. Validate payload tối thiểu
        if (!isValidPayload(payload)) {
            log.warn("[GHN Webhook] Payload không hợp lệ: {}", payload);
            return;
        }

        // 2. Validate ShopID — tránh giả mạo từ hệ thống khác
        if (!isFromOurShop(payload)) {
            log.warn("[GHN Webhook] ShopID không khớp: nhận={}, expected={}",
                    payload.getShopId(), ghnConfig.getGhnShopId());
            return;
        }

        log.info("[GHN Webhook] Nhận sự kiện type={}, orderCode={}, status={}",
                payload.getType(), payload.getOrderCode(), payload.getStatus());

        // 3. Dispatch theo Type
        String type = payload.getType() == null ? "" : payload.getType().toLowerCase();
        switch (type) {
            case "switch_status" -> handleStatusChanged(payload);
            case "create"        -> handleOrderCreated(payload);
            case "update_weight" -> handleWeightUpdated(payload);
            case "update_cod"    -> handleCodUpdated(payload);
            case "update_fee"    -> handleFeeUpdated(payload);
            default              -> log.warn("[GHN Webhook] Loại sự kiện không xác định: {}", payload.getType());
        }
    }

    // ----------------------------------------------------------------
    // Handlers theo từng Type
    // ----------------------------------------------------------------

    /**
     * switch_status — Đây là sự kiện quan trọng nhất.
     * Ánh xạ trạng thái GHN → OrderStatus nội bộ và cập nhật DB.
     */
    @Transactional
    protected void handleStatusChanged(GhnWebhookPayload payload) {
        String orderCode = payload.getOrderCode();
        GhnStatus ghnStatus = GhnStatus.fromCode(payload.getStatus());

        log.info("[GHN Webhook] switch_status: orderCode={}, ghnStatus={}", orderCode, ghnStatus);

        // Chỉ xử lý các trạng thái có ánh xạ sang OrderStatus nội bộ
        if (!ghnStatus.hasMappedStatus()) {
            log.debug("[GHN Webhook] Trạng thái {} không cần cập nhật DB, bỏ qua.", ghnStatus);
            return;
        }

        orderRepository.findByTrackingCode(orderCode).ifPresentOrElse(
                order -> {
                    // Idempotency check: nếu đơn đã ở trạng thái đích rồi thì bỏ qua
                    if (order.getStatus() == ghnStatus.getMappedOrderStatus()) {
                        log.info("[GHN Webhook] Đơn hàng {} đã ở trạng thái {}, bỏ qua.",
                                order.getId(), order.getStatus());
                        return;
                    }

                    order.setStatus(ghnStatus.getMappedOrderStatus());
                    orderRepository.save(order);

                    log.info("[GHN Webhook] ✅ Cập nhật đơn hàng id={} → {}", order.getId(), order.getStatus());
                    // TODO: Gửi email thông báo khách hàng (orderProducer.sendStatusUpdate)
                },
                () -> log.warn("[GHN Webhook] Không tìm thấy đơn hàng với trackingCode={}", orderCode)
        );
    }

    /**
     * create — GHN xác nhận đã tiếp nhận đơn (trạng thái ready_to_pick).
     * Không cần cập nhật OrderStatus vì hệ thống đã set SHIPPING khi gọi API tạo đơn.
     * Chỉ log để debug.
     */
    protected void handleOrderCreated(GhnWebhookPayload payload) {
        log.info("[GHN Webhook] create: orderCode={} — Đơn đã được GHN tiếp nhận.",
                payload.getOrderCode());
    }

    /**
     * update_weight — GHN cập nhật cân nặng thực tế sau khi cân.
     * Hiện tại chỉ log. Có thể mở rộng để lưu vào Order nếu cần.
     */
    protected void handleWeightUpdated(GhnWebhookPayload payload) {
        log.info("[GHN Webhook] update_weight: orderCode={}, weight={}g",
                payload.getOrderCode(), payload.getWeight());
        // TODO: Lưu converted_weight vào Order nếu cần xuất hoá đơn
    }

    /**
     * update_cod — GHN xác nhận đã thu/chuyển tiền COD.
     */
    protected void handleCodUpdated(GhnWebhookPayload payload) {
        log.info("[GHN Webhook] update_cod: orderCode={}, codAmount={}đ, transferDate={}",
                payload.getOrderCode(), payload.getCodAmount(), payload.getCodTransferDate());
        // TODO: Cập nhật trạng thái thanh toán COD nếu có
    }

    /**
     * update_fee — GHN điều chỉnh phí vận chuyển (hiếm gặp).
     */
    protected void handleFeeUpdated(GhnWebhookPayload payload) {
        log.info("[GHN Webhook] update_fee: orderCode={}, totalFee={}đ",
                payload.getOrderCode(), payload.getTotalFee());
        // TODO: Cập nhật shippingFee trong Order nếu nghiệp vụ yêu cầu
    }

    // ----------------------------------------------------------------
    // Helpers
    // ----------------------------------------------------------------

    private boolean isValidPayload(GhnWebhookPayload payload) {
        return payload != null
                && payload.getOrderCode() != null
                && !payload.getOrderCode().isBlank()
                && payload.getType() != null
                && !payload.getType().isBlank();
    }

    /**
     * So sánh ShopID trong payload với ShopID cấu hình trong application.yaml.
     *
     * GhnConfig.getGhnShopId() trả về String (VD: "4905307").
     * GhnWebhookPayload.shopId là Integer.
     * So sánh qua String để tránh parse error.
     */
    private boolean isFromOurShop(GhnWebhookPayload payload) {
        if (payload.getShopId() == null) return false;
        return String.valueOf(payload.getShopId()).equals(ghnConfig.getGhnShopId());
    }
}