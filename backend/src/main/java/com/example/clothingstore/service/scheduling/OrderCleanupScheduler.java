package com.example.clothingstore.service.scheduling;

import com.example.clothingstore.entity.Order;
import com.example.clothingstore.entity.OrderItem;
import com.example.clothingstore.entity.Enum.OrderStatus;
import com.example.clothingstore.repository.OrderRepository;
import com.example.clothingstore.service.InventoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderCleanupScheduler {

    private final OrderRepository orderRepository;
    private final InventoryService inventoryService;

    @Scheduled(fixedRate = 300000)
    @Transactional
    public void cancelUnpaidVnPayOrders() {
        LocalDateTime fifteenMinsAgo = LocalDateTime.now().minusMinutes(15);

        List<Order> abandonedOrders = orderRepository.findAbandonedOrders(
                OrderStatus.PENDING, "VNPAY", fifteenMinsAgo
        );

        if (abandonedOrders.isEmpty()) {
            return;
        }

        log.info("Phát hiện {} đơn hàng VNPay quá hạn thanh toán. Đang tiến hành hủy và hoàn tồn kho...", abandonedOrders.size());

        for (Order order : abandonedOrders) {
            order.setStatus(OrderStatus.CANCELLED);
            order.setCancelReason("Hủy tự động: Quá 15 phút không hoàn tất thanh toán VNPay");
            order.setCancelledAt(LocalDateTime.now());

            if (order.getOrderItems() != null) {
                for (OrderItem item : order.getOrderItems()) {
                    try {
                        inventoryService.releaseStock(item.getSkuId(), item.getQuantity());
                    } catch (Exception e) {
                        log.error("Lỗi hoàn tồn kho cho skuId {}: {}", item.getSkuId(), e.getMessage());
                    }
                }
            }
        }

        orderRepository.saveAll(abandonedOrders);
    }
}