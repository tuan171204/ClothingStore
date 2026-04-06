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

        FlashSale saved = flashSaleRepository.save(sale);

        if (request.items() != null) {
            List<FlashSaleItem> items = buildItems(request.items(), saved);
            saved.setItems(items);
            flashSaleRepository.save(saved); // cascade saves items
        }

        return toResponse(saved);
    }

    // ── UPDATE ────────────────────────────────────────────────────

    /**
     * Full replacement strategy: delete all existing items and re-create from request.
     * This is safe because FlashSaleItem has no @Version — we intentionally skip optimistic
     * locking here (as noted in the architecture context). High-concurrency sold_quantity
     * deduction during a live sale should go through Redis atomic operations, not MySQL row locks.
     */
    @Override
    @Transactional
    public FlashSaleResponse update(Long id, FlashSaleRequest request) {
        FlashSale sale = findOrThrow(id);
        validateDates(request.startTime(), request.endTime());

        sale.setName(request.name());
        sale.setStartTime(request.startTime());
        sale.setEndTime(request.endTime());
        sale.setActive(request.isActive());

        // Clear and rebuild items (orphanRemoval = true handles the DELETE)
        sale.getItems().clear();
        flashSaleRepository.save(sale); // flush clears

        if (request.items() != null) {
            List<FlashSaleItem> newItems = buildItems(request.items(), sale);
            sale.getItems().addAll(newItems);
        }

        return toResponse(flashSaleRepository.save(sale));
    }

    // ── DELETE ────────────────────────────────────────────────────

    @Override
    @Transactional
    public void delete(Long id) {
        if (!flashSaleRepository.existsById(id)) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
        flashSaleRepository.deleteById(id); // cascade deletes items
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
        LocalDateTime now = LocalDateTime.now();
        String status;
        if (now.isBefore(sale.getStartTime()))      status = "UPCOMING";
        else if (now.isAfter(sale.getEndTime()))    status = "ENDED";
        else                                        status = "ACTIVE";

        List<FlashSaleResponse.FlashSaleItemResponse> itemResponses =
                sale.getItems().stream().map(item -> {
                    Sku sku = item.getSku();
                    String variantName = sku.getValues().stream()
                            .map(v -> v.getOptionValue().getValue())
                            .collect(Collectors.joining(" - "));
                    String productName = sku.getProduct() != null ? sku.getProduct().getName() : "";
                    String thumbnail = sku.getImgUrl() != null ? sku.getImgUrl()
                            : (sku.getProduct() != null ? sku.getProduct().getThumbnail() : null);

                    return new FlashSaleResponse.FlashSaleItemResponse(
                            item.getId(),
                            sku.getId(),
                            sku.getCode(),
                            productName,
                            variantName,
                            thumbnail,
                            sku.getPrice(),                               // original price
                            item.getPromotionalPrice(),
                            item.getTotalQuantity(),
                            item.getSoldQuantity(),
                            item.getTotalQuantity() - item.getSoldQuantity()  // remaining
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