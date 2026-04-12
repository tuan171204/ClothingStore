package com.example.clothingstore.service.impl;

import com.example.clothingstore.dtos.PagedResponse;
import com.example.clothingstore.dtos.flashsale.request.FlashSaleRequest;
import com.example.clothingstore.dtos.flashsale.response.FlashSaleResponse;
import com.example.clothingstore.entity.FlashSale;
import com.example.clothingstore.entity.FlashSaleItem;
import com.example.clothingstore.entity.Sku;
import com.example.clothingstore.exception.AppException;
import com.example.clothingstore.exception.ErrorCode;
import com.example.clothingstore.repository.FlashSaleRepository;
import com.example.clothingstore.repository.FlashSaleItemRepository;
import com.example.clothingstore.repository.SkuRepository;
import com.example.clothingstore.service.FlashSaleService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FlashSaleServiceImpl implements FlashSaleService {

    private final FlashSaleRepository flashSaleRepository;
    private final FlashSaleItemRepository flashSaleItemRepository;
    private final SkuRepository skuRepository;
    private final FlashSaleRedisService flashSaleRedisService;

    private static final long STATUS_GRACE_SECONDS = 30L;

    private String deriveStatus(FlashSale sale) {
        LocalDateTime now       = LocalDateTime.now();
        LocalDateTime gracedNow = now.plusSeconds(STATUS_GRACE_SECONDS);

        if (gracedNow.isBefore(sale.getStartTime())) return "UPCOMING";
        if (now.isAfter(sale.getEndTime()))           return "ENDED";
        return "ACTIVE";
    }

    // ── READ ──────────────────────────────────────────────────────

    @Override
    public PagedResponse<FlashSaleResponse> getAll(String keyword, int page, int size) {
        var pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<FlashSale> result = (keyword != null && !keyword.isBlank())
                ? flashSaleRepository.findByNameContainingIgnoreCase(keyword.trim(), pageable)
                : flashSaleRepository.findAll(pageable);

        return PagedResponse.<FlashSaleResponse>builder()
                .content(result.getContent().stream().map(this::toResponse).collect(Collectors.toList()))
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .first(result.isFirst())
                .last(result.isLast())
                .build();
    }

    @Override
    public FlashSaleResponse getById(Long id) {
        return toResponse(findOrThrow(id));
    }

    // ── CREATE ────────────────────────────────────────────────────

    @Override
    @Transactional
    public FlashSaleResponse create(FlashSaleRequest request) {
        validateDates(request.startTime(), request.endTime());

        FlashSale sale = FlashSale.builder()
                .name(request.name())
                .startTime(request.startTime())
                .endTime(request.endTime())
                .isActive(request.isActive())
                .items(new ArrayList<>())
                .build();

        if (request.items() != null) {
            List<FlashSaleItem> items = buildItems(request.items(), sale);
            sale.setItems(items);
        }

        FlashSale saved = flashSaleRepository.save(sale);

        // Sync to Redis — this handles the "kích hoạt ngay" case correctly
        // because syncFlashSaleToRedis checks isActive and TTL from endTime
        flashSaleRedisService.syncFlashSaleToRedis(saved);

        return toResponse(saved);
    }

    // ── UPDATE ────────────────────────────────────────────────────

    @Override
    @Transactional
    public FlashSaleResponse update(Long id, FlashSaleRequest request) {
        FlashSale sale = findOrThrow(id);
        validateDates(request.startTime(), request.endTime());

        flashSaleRedisService.clearFlashSaleFromRedis(sale);

        sale.setName(request.name());
        sale.setStartTime(request.startTime());
        sale.setEndTime(request.endTime());
        sale.setActive(request.isActive());

        sale.getItems().clear();
        if (request.items() != null) {
            List<FlashSaleItem> newItems = buildItems(request.items(), sale);
            sale.getItems().addAll(newItems);
        }

        FlashSale saved = flashSaleRepository.save(sale);

        flashSaleRedisService.syncFlashSaleToRedis(saved);

        return toResponse(saved);
    }

    // ── DELETE ────────────────────────────────────────────────────

    @Override
    @Transactional
    public void delete(Long id) {
        if (!flashSaleRepository.existsById(id)) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
        FlashSale sale = findOrThrow(id);
        flashSaleRedisService.clearFlashSaleFromRedis(sale);
        flashSaleRepository.deleteById(id);
    }

    // ── GET CURRENT ACTIVE ────────────────────────────────────────

    /**
     * FIX: Use the graced "now" so a sale starting "right now" is included.
     * Pass gracedNow to the repository query so it matches sales that started
     * up to GRACE_SECONDS in the future.
     */
    @Override
    public FlashSaleResponse getCurrentActive() {
        LocalDateTime gracedNow = LocalDateTime.now().plusSeconds(STATUS_GRACE_SECONDS);

        FlashSale currentSale = flashSaleRepository.findCurrentActiveSales(gracedNow)
                .stream()
                .findFirst()
                .orElse(null);

        if (currentSale == null) {
            return null;
        }

        FlashSaleResponse baseResponse = toResponse(currentSale);

        List<FlashSaleResponse.FlashSaleItemResponse> realTimeItems = baseResponse.items().stream()
                .map(item -> {
                    Integer realRemaining = flashSaleRedisService.getRealTimeRemainingStock(
                            currentSale.getId(), item.skuId());
                    int finalRemaining = realRemaining != null ? realRemaining : item.remainingQuantity();

                    return new FlashSaleResponse.FlashSaleItemResponse(
                            item.id(), item.skuId(), item.productId(), item.skuCode(),
                            item.productName(), item.variantName(), item.thumbnailUrl(),
                            item.originalPrice(), item.promotionalPrice(),
                            item.totalQuantity(), item.totalQuantity() - finalRemaining, finalRemaining
                    );
                })
                .collect(Collectors.toList());

        return new FlashSaleResponse(
                baseResponse.id(), baseResponse.name(), baseResponse.startTime(),
                baseResponse.endTime(), baseResponse.isActive(), baseResponse.status(), realTimeItems
        );
    }

    // ── PRIVATE HELPERS ───────────────────────────────────────────

    private FlashSale findOrThrow(Long id) {
        return flashSaleRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));
    }

    private void validateDates(LocalDateTime start, LocalDateTime end) {
        if (start == null || end == null) {
            throw new AppException(ErrorCode.INVALID_DATA);
        }
        if (!end.isAfter(start)) {
            throw new AppException(ErrorCode.INVALID_DATA);
        }
    }

    private List<FlashSaleItem> buildItems(
            List<FlashSaleRequest.FlashSaleItemRequest> itemReqs,
            FlashSale sale) {

        return itemReqs.stream().map(req -> {
            Sku sku = skuRepository.findById(req.skuId())
                    .orElseThrow(() -> new AppException(ErrorCode.SKU_NOT_FOUND));

            return FlashSaleItem.builder()
                    .flashSale(sale)
                    .sku(sku)
                    .promotionalPrice(req.promotionalPrice())
                    .totalQuantity(req.totalQuantity())
                    .soldQuantity(0)
                    .build();
        }).collect(Collectors.toList());
    }

    // ── MAPPER ────────────────────────────────────────────────────

    private FlashSaleResponse toResponse(FlashSale sale) {
        // FIX: Use deriveStatus() with grace buffer instead of raw time comparison
        String status = deriveStatus(sale);

        List<FlashSaleResponse.FlashSaleItemResponse> itemResponses =
                sale.getItems().stream().map(item -> {
                    Sku sku = item.getSku();
                    String variantName = sku.getValues().stream()
                            .map(v -> v.getOptionValue().getValue())
                            .collect(Collectors.joining(" - "));
                    String productName = sku.getProduct() != null ? sku.getProduct().getName() : "";
                    String thumbnail   = sku.getImgUrl() != null ? sku.getImgUrl()
                            : (sku.getProduct() != null ? sku.getProduct().getThumbnail() : null);

                    return new FlashSaleResponse.FlashSaleItemResponse(
                            item.getId(),
                            sku.getId(),
                            sku.getProduct() != null ? sku.getProduct().getId() : null,
                            sku.getCode(),
                            productName,
                            variantName,
                            thumbnail,
                            sku.getPrice(),
                            item.getPromotionalPrice(),
                            item.getTotalQuantity(),
                            item.getSoldQuantity(),
                            item.getTotalQuantity() - item.getSoldQuantity()
                    );
                }).collect(Collectors.toList());

        return new FlashSaleResponse(
                sale.getId(),
                sale.getName(),
                sale.getStartTime(),
                sale.getEndTime(),
                sale.isActive(),
                status,
                itemResponses
        );
    }
}