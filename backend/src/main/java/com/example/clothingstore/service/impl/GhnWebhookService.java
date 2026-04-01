package com.example.clothingstore.service.impl;

import com.example.clothingstore.config.GhnConfig;
import com.example.clothingstore.dtos.webhook.GhnWebhookPayload;
import com.example.clothingstore.entity.Enum.GhnStatus;
import com.example.clothingstore.entity.Enum.OrderStatus;
import com.example.clothingstore.entity.Order;
import com.example.clothingstore.entity.OrderItem;
import com.example.clothingstore.repository.OrderRepository;
import com.example.clothingstore.service.InventoryService;
import com.example.clothingstore.service.rabbitmq.OrderProducer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service xử lý toàn bộ business logic khi nhận webhook từ GHN.
 *
 * Nguyên tắc thiết kế:
 *  1. Idempotent       — kiểm tra trạng thái hiện tại trước khi ghi, tránh cập nhật trùng.
 *  2. Always 200       — không throw ra ngoài, lỗi được log nội bộ.
 *  3. Validate ShopID  — từ chối payload không thuộc shop của mình.
 *  4. Dual-field update— cập nhật cả OrderStatus (cốt lõi) lẫn trackingStatus + trackingMessage
 *                        để Front-end có thể hiển thị thông tin chi tiết cho khách hàng.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GhnWebhookService {

    private final OrderRepository orderRepository;
    private final GhnConfig       ghnConfig;
    private final InventoryService inventoryService; // Thêm dòng này
    private final OrderProducer orderProducer;

    // ----------------------------------------------------------------
    // Entry point — gọi từ WebhookController
    // ----------------------------------------------------------------

    public void handle(GhnWebhookPayload payload) {

        if (!isValidPayload(payload)) {
            log.warn("[GHN Webhook] Payload không hợp lệ hoặc thiếu trường bắt buộc: {}", payload);
            return;
        }

        if (!isFromOurShop(payload)) {
            log.warn("[GHN Webhook] ShopID không khớp: nhận={}, expected={}",
                    payload.getShopId(), ghnConfig.getGhnShopId());
            return;
        }

        log.info("[GHN Webhook] Nhận event type={}, orderCode={}, status={}",
                payload.getType(), payload.getOrderCode(), payload.getStatus());

        String type = payload.getType().toLowerCase().trim();
        switch (type) {
            case "switch_status" -> handleStatusChanged(payload);
            case "create"        -> handleOrderCreated(payload);
            case "update_weight" -> handleWeightUpdated(payload);
            case "update_cod"    -> handleCodUpdated(payload);
            case "update_fee"    -> handleFeeUpdated(payload);
            default              -> log.warn("[GHN Webhook] Loại sự kiện chưa được hỗ trợ: {}", payload.getType());
        }
    }

    // ----------------------------------------------------------------
    // switch_status — sự kiện quan trọng nhất
    // ----------------------------------------------------------------

    /**
     * Cập nhật đồng thời:
     *   1. order.trackingStatus  ← ghnCode (raw, dùng để debug / filter)
     *   2. order.trackingMessage ← thông báo thân thiện cho khách xem
     *   3. order.status          ← chỉ đổi khi GHN báo trạng thái cuối (delivered/cancel/return...)
     */
    @Transactional
    protected void handleStatusChanged(GhnWebhookPayload payload) {
        String orderCode = payload.getOrderCode();
        GhnStatus ghnStatus = GhnStatus.fromCode(payload.getStatus());

        log.info("[GHN Webhook] switch_status: orderCode={}, ghnCode={}, mapped={}",
                orderCode, ghnStatus.getGhnCode(), ghnStatus.getMappedOrderStatus());

        orderRepository.findByTrackingCode(orderCode).ifPresentOrElse(
                order -> processStatusUpdate(order, ghnStatus),
                () -> log.warn("[GHN Webhook] Không tìm thấy đơn hàng với trackingCode={}", orderCode)
        );
    }

    /**
     * Tách logic xử lý ra method riêng để dễ test.
     */
    private void processStatusUpdate(Order order, GhnStatus ghnStatus) {

        boolean changed = false;

        // 1. Luôn cập nhật tracking_status + tracking_message (dù có thay đổi OrderStatus hay không)
        //    để khách hàng thấy trạng thái mới nhất trên trang theo dõi đơn.
        String newTrackingStatus  = ghnStatus.getGhnCode();
        String newTrackingMessage = ghnStatus.getTrackingMessage();

        if (!newTrackingStatus.equals(order.getTrackingStatus())) {
            order.setTrackingStatus(newTrackingStatus);
            order.setTrackingMessage(newTrackingMessage);
            changed = true;
            log.info("[GHN Webhook] trackingStatus {} → {} (orderId={})",
                    order.getTrackingStatus(), newTrackingStatus, order.getId());
        }

        // 2. Chỉ đổi OrderStatus cốt lõi khi GHN báo trạng thái cuối
        if (ghnStatus.hasMappedStatus()) {
            OrderStatus oldStatus = order.getStatus();
            OrderStatus newStatus = ghnStatus.getMappedOrderStatus();

            if (oldStatus != newStatus) {
                log.info("[GHN Webhook] OrderStatus {} → {} (orderId={})", oldStatus, newStatus, order.getId());
                order.setStatus(newStatus);
                changed = true;

                // 1. XỬ LÝ HỦY/HOÀN TRẢ: Giải phóng tồn kho và gửi mail Hủy
                if (newStatus == OrderStatus.CANCELLED && oldStatus != OrderStatus.CANCELLED && oldStatus != OrderStatus.COMPLETED) {
                    List<OrderItem> items = order.getOrderItems();
                    if (items != null) {
                        for (OrderItem item : items) {
                            inventoryService.releaseStock(item.getSkuId(), item.getQuantity());
                        }
                    }
                    orderProducer.sendOrderCancelled(order.getId()); // Bắn sự kiện Hủy
                }

                // 2. XỬ LÝ GIAO THÀNH CÔNG: Trừ tồn kho vật lý và gửi mail Thành công
                if (newStatus == OrderStatus.COMPLETED && oldStatus != OrderStatus.COMPLETED) {
                    List<OrderItem> items = order.getOrderItems();
                    if (items != null) {
                        for (OrderItem item : items) {
                            inventoryService.deductStock(item.getSkuId(), item.getQuantity());
                        }
                    }
                    orderProducer.sendOrderDelivered(order.getId()); // Bắn sự kiện Thành công
                }
            }
        }

        if (changed) {
            orderRepository.save(order);
            log.info("[GHN Webhook] ✅ Lưu cập nhật đơn hàng id={}", order.getId());
        }
    }

    // ----------------------------------------------------------------
    // Các handler còn lại
    // ----------------------------------------------------------------

    protected void handleOrderCreated(GhnWebhookPayload payload) {
        // GHN xác nhận đã tiếp nhận đơn → hệ thống đã set SHIPPING từ trước, chỉ cần log
        log.info("[GHN Webhook] create: orderCode={} — GHN đã tiếp nhận đơn.", payload.getOrderCode());

        // Tùy chọn: cập nhật trackingMessage = "Đơn hàng đang chờ shipper đến lấy"
        orderRepository.findByTrackingCode(payload.getOrderCode()).ifPresent(order -> {
            GhnStatus readyToPick = GhnStatus.READY_TO_PICK;
            order.setTrackingStatus(readyToPick.getGhnCode());
            order.setTrackingMessage(readyToPick.getTrackingMessage());
            orderRepository.save(order);
        });
    }

    protected void handleWeightUpdated(GhnWebhookPayload payload) {
        log.info("[GHN Webhook] update_weight: orderCode={}, weight={}g",
                payload.getOrderCode(), payload.getWeight());
        // TODO: Lưu converted_weight vào Order nếu cần xuất hoá đơn vận chuyển
    }

    protected void handleCodUpdated(GhnWebhookPayload payload) {
        log.info("[GHN Webhook] update_cod: orderCode={}, codAmount={}đ, transferDate={}",
                payload.getOrderCode(), payload.getCodAmount(), payload.getCodTransferDate());
        // TODO: Cập nhật trạng thái đã thu/chuyển tiền COD nếu có nghiệp vụ liên quan
    }

    protected void handleFeeUpdated(GhnWebhookPayload payload) {
        log.info("[GHN Webhook] update_fee: orderCode={}, totalFee={}đ",
                payload.getOrderCode(), payload.getTotalFee());
        // TODO: Cập nhật shippingFee trong Order nếu nghiệp vụ yêu cầu hiển thị phí thực tế
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

    private boolean isFromOurShop(GhnWebhookPayload payload) {
        if (payload.getShopId() == null) return false;
        return String.valueOf(payload.getShopId()).equals(ghnConfig.getGhnShopId());
    }
}