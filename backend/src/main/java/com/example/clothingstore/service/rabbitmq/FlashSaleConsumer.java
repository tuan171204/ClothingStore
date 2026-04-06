package com.example.clothingstore.service.rabbitmq;

import com.example.clothingstore.config.RabbitMQConfig;
import com.example.clothingstore.dtos.event.FlashSaleSyncMessage;
import com.example.clothingstore.repository.FlashSaleItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class FlashSaleConsumer {

    private final FlashSaleItemRepository flashSaleItemRepository;

    @RabbitListener(queues = RabbitMQConfig.FS_SYNC_QUEUE)
    @Transactional
    public void consumeFlashSaleSync(FlashSaleSyncMessage msg) {
        flashSaleItemRepository.findByFlashSaleIdAndSkuId(msg.getFlashSaleId(), msg.getSkuId())
                .ifPresent(item -> {
                    // Tăng số lượng đã bán dưới DB
                    item.setSoldQuantity(item.getSoldQuantity() + msg.getQuantity());
                    flashSaleItemRepository.save(item);
                    log.info("⚡ Đồng bộ Flash Sale ID {} - SKU {} (+{} items)", msg.getFlashSaleId(), msg.getSkuId(), msg.getQuantity());
                });
    }
}