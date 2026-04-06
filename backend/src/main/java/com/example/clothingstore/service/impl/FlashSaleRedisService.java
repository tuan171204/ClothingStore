package com.example.clothingstore.service.impl;

import com.example.clothingstore.entity.FlashSale;
import com.example.clothingstore.entity.FlashSaleItem;
import com.example.clothingstore.exception.AppException;
import com.example.clothingstore.exception.ErrorCode;
import com.example.clothingstore.repository.FlashSaleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class FlashSaleRedisService {

    // dùng StringRedisTemplate để lưu số thuần túy cho lệnh DECR
    private final StringRedisTemplate stringRedisTemplate;
    private final FlashSaleRepository flashSaleRepository;

    public record FlashSaleCheckResult(Long flashSaleId, BigDecimal promotionalPrice) {}


    // ── ĐỒNG BỘ DỮ LIỆU TỪ MYSQL LÊN REDIS ──────────────────────────────────
    public void syncFlashSaleToRedis(FlashSale sale) {
        if (!sale.isActive()) {
            clearFlashSaleFromRedis(sale);
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        if (sale.getEndTime().isBefore(now)) return;

        long ttlSeconds = Duration.between(now, sale.getEndTime()).getSeconds();
        if (ttlSeconds <= 0) return;

        // Lưu thêm thời gian bắt đầu để Checkout check chặn mua sớm
        stringRedisTemplate.opsForValue().set("flash_sale:" + sale.getId() + ":start_time",
                sale.getStartTime().toString(), ttlSeconds, TimeUnit.SECONDS);

        for (FlashSaleItem item : sale.getItems()) {
            String stockKey = getStockKey(sale.getId(), item.getSku().getId());
            String priceKey = getPriceKey(sale.getId(), item.getSku().getId());
            String activeSkuKey = "flash_sale:active_sku:" + item.getSku().getId();

            int remaining = item.getTotalQuantity() - item.getSoldQuantity();
            if (remaining < 0) remaining = 0;

            stringRedisTemplate.opsForValue().set(stockKey, String.valueOf(remaining), ttlSeconds, TimeUnit.SECONDS);
            stringRedisTemplate.opsForValue().set(priceKey, item.getPromotionalPrice().toString(), ttlSeconds, TimeUnit.SECONDS);
            stringRedisTemplate.opsForValue().set(activeSkuKey, String.valueOf(sale.getId()), ttlSeconds, TimeUnit.SECONDS);
        }
        log.info("🔄 Đã đồng bộ FlashSale #{} lên Redis thành công.", sale.getId());
    }

    // ── XÓA DỮ LIỆU KHỎI REDIS (KHI ADMIN TẮT HOẶC XÓA) ──────────────────────
    public void clearFlashSaleFromRedis(FlashSale sale) {
        stringRedisTemplate.delete("flash_sale:" + sale.getId() + ":start_time");
        for (FlashSaleItem item : sale.getItems()) {
            stringRedisTemplate.delete(getStockKey(sale.getId(), item.getSku().getId()));
            stringRedisTemplate.delete(getPriceKey(sale.getId(), item.getSku().getId()));
            stringRedisTemplate.delete("flash_sale:active_sku:" + item.getSku().getId());
        }
        log.info("🗑️ Đã xóa FlashSale #{} khỏi Redis.", sale.getId());
    }

    // ──  HÀM DÙNG CHO CHECKOUT SERVICE ──
    public FlashSaleCheckResult checkAndDeductFlashSale(Long skuId, int quantity) {
        String activeSkuKey = "flash_sale:active_sku:" + skuId;
        String saleIdStr = stringRedisTemplate.opsForValue().get(activeSkuKey);

        if (saleIdStr == null) return null; // Không có Flash Sale

        Long saleId = Long.parseLong(saleIdStr);

        // KIỂM TRA ĐÃ TỚI GIỜ SALE CHƯA?
        String startTimeStr = stringRedisTemplate.opsForValue().get("flash_sale:" + saleId + ":start_time");
        if (startTimeStr != null && LocalDateTime.parse(startTimeStr).isAfter(LocalDateTime.now())) {
            return null; // Chưa tới giờ, bỏ qua Redis và mua giá gốc bình thường
        }

        String stockKey = getStockKey(saleId, skuId);
        String priceKey = getPriceKey(saleId, skuId);

        Long newStock = stringRedisTemplate.opsForValue().decrement(stockKey, quantity);

        if (newStock != null && newStock < 0) {
            stringRedisTemplate.opsForValue().increment(stockKey, quantity);
            throw new AppException(ErrorCode.SKU_FLASH_SALES_OUT_OF_STOCK);
        }

        String priceStr = stringRedisTemplate.opsForValue().get(priceKey);
        BigDecimal promoPrice = new BigDecimal(priceStr != null ? priceStr : "0");

        return new FlashSaleCheckResult(saleId, promoPrice);
    }

    public void revertFlashSaleStock(Long saleId, Long skuId, int quantity) {
        String stockKey = getStockKey(saleId, skuId);
        stringRedisTemplate.opsForValue().increment(stockKey, quantity);
    }

    public Integer getRealTimeRemainingStock(Long saleId, Long skuId) {
        String stockKey = getStockKey(saleId, skuId);
        String stockStr = stringRedisTemplate.opsForValue().get(stockKey);
        return stockStr != null ? Integer.parseInt(stockStr) : null;
    }

    public BigDecimal getFlashSalePromoPrice(Long skuId) {
        String activeSkuKey = "flash_sale:active_sku:" + skuId;
        String saleIdStr = stringRedisTemplate.opsForValue().get(activeSkuKey);

        if (saleIdStr == null) return null; // Không có trong danh bạ Sale

        Long saleId = Long.parseLong(saleIdStr);

        // Kiểm tra xem đã tới giờ Sale chưa?
        String startTimeStr = stringRedisTemplate.opsForValue().get("flash_sale:" + saleId + ":start_time");
        if (startTimeStr != null && LocalDateTime.parse(startTimeStr).isAfter(LocalDateTime.now())) {
            return null;
        }

        // Kiểm tra xem kho Redis còn hàng không?
        String stockKey = getStockKey(saleId, skuId);
        String stockStr = stringRedisTemplate.opsForValue().get(stockKey);
        if (stockStr == null || Integer.parseInt(stockStr) <= 0) {
            return null; // Hết hàng Flash Sale -> Về giá gốc
        }

        String priceKey = getPriceKey(saleId, skuId);
        String priceStr = stringRedisTemplate.opsForValue().get(priceKey);

        return priceStr != null ? new BigDecimal(priceStr) : null;
    }

    // ── PRE-WARM: TỰ ĐỘNG CHẠY KHI SPRING BOOT KHỞI ĐỘNG XONG ───────────────
    @EventListener(ApplicationReadyEvent.class)
    public void preWarmFlashSalesOnStartup() {
        log.info("🚀 [PRE-WARM] Đang tải dữ liệu Flash Sale từ MySQL lên Redis...");
        List<FlashSale> activeSales = flashSaleRepository.findCurrentlyActiveSales();

        for (FlashSale sale : activeSales) {
            syncFlashSaleToRedis(sale);
        }
        log.info("✅ [PRE-WARM] Hoàn tất tải {} chiến dịch Flash Sale.", activeSales.size());
    }

    // ── HELPER: Format Keys ────────────────────────────────────────────────────
    public String getStockKey(Long saleId, Long skuId) {
        return "flash_sale:" + saleId + ":sku:" + skuId + ":stock";
    }

    public String getPriceKey(Long saleId, Long skuId) {
        return "flash_sale:" + saleId + ":sku:" + skuId + ":price";
    }
}