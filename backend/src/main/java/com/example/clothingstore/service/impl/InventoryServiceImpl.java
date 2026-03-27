package com.example.clothingstore.service.impl;

import com.example.clothingstore.dto.request.StockAdjustmentRequest;
import com.example.clothingstore.dto.request.UpdateLowStockThresholdRequest;
import com.example.clothingstore.dto.response.*;
import com.example.clothingstore.entity.*;
import com.example.clothingstore.entity.Enum.StockMovementType;
import com.example.clothingstore.entity.Enum.StockReferenceType;
import com.example.clothingstore.repository.*;
import com.example.clothingstore.service.InventoryService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class InventoryServiceImpl implements InventoryService {

    InventoryRepository inventoryRepository;
    SkuRepository skuRepository;
    StockMovementRepository stockMovementRepository;
    StockAdjustmentRepository stockAdjustmentRepository;
    UserRepository userRepository;

    // ============================================================
    // INV-001: Core Stock Operations
    // ============================================================

    @Override
    public Inventory getOrCreateInventory(Sku sku) {
        return inventoryRepository.findBySkuId(sku.getId())
                .orElseGet(() -> {
                    int initialQty = sku.getStockQuantity() != null ? sku.getStockQuantity() : 0;
                    return inventoryRepository.save(
                            Inventory.builder()
                                    .sku(sku)
                                    .physicalQuantity(initialQty)
                                    .availableQuantity(initialQty)
                                    .reservedQuantity(0)
                                    .defectQuantity(0)
                                    .lowStockThreshold(0)
                                    .build());
                });
    }

    @Override
    @Transactional
    public void reserveStock(Long skuId, int quantity) {
        Sku sku = findSkuOrThrow(skuId);
        Inventory inv = getOrCreateInventory(sku);

        if (inv.getAvailableQuantity() < quantity) {
            throw new RuntimeException(
                    "Không đủ tồn kho: SKU " + skuId + " chỉ còn " + inv.getAvailableQuantity() + " sản phẩm");
        }

        int before = inv.getAvailableQuantity();
        inv.setReservedQuantity(inv.getReservedQuantity() + quantity);
        inv.setAvailableQuantity(inv.getAvailableQuantity() - quantity);
        inventoryRepository.save(inv);

        logMovement(sku, StockMovementType.RESERVE, quantity,
                StockReferenceType.ORDER, null,
                before, inv.getAvailableQuantity(),
                "Giữ chỗ cho đơn hàng");
    }

    @Override
    @Transactional
    public void releaseStock(Long skuId, int quantity) {
        Sku sku = findSkuOrThrow(skuId);
        Inventory inv = getOrCreateInventory(sku);

        int before = inv.getAvailableQuantity();
        inv.setReservedQuantity(Math.max(0, inv.getReservedQuantity() - quantity));
        inv.setAvailableQuantity(inv.getAvailableQuantity() + quantity);
        inventoryRepository.save(inv);

        // Đồng bộ lại Sku.stockQuantity
        sku.setStockQuantity(inv.getAvailableQuantity());
        skuRepository.save(sku);

        logMovement(sku, StockMovementType.RELEASE, quantity,
                StockReferenceType.ORDER, null,
                before, inv.getAvailableQuantity(),
                "Giải phóng tồn kho do hủy đơn");
    }

    @Override
    @Transactional
    public void deductStock(Long skuId, int quantity) {
        Sku sku = findSkuOrThrow(skuId);
        Inventory inv = getOrCreateInventory(sku);

        int before = inv.getPhysicalQuantity();
        inv.setPhysicalQuantity(Math.max(0, inv.getPhysicalQuantity() - quantity));
        inv.setReservedQuantity(Math.max(0, inv.getReservedQuantity() - quantity));
        inventoryRepository.save(inv);

        logMovement(sku, StockMovementType.OUT, quantity,
                StockReferenceType.ORDER, null,
                before, inv.getPhysicalQuantity(),
                "Xuất kho theo đơn hàng hoàn thành");
    }

    // ============================================================
    // INV-004: Low Stock Alert
    // ============================================================

    @Override
    public List<InventoryResponse> getLowStockItems() {
        return inventoryRepository.findLowStockItems()
                .stream()
                .map(this::toInventoryResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public InventoryResponse updateLowStockThreshold(Long skuId, UpdateLowStockThresholdRequest request) {
        Sku sku = findSkuOrThrow(skuId);
        Inventory inv = getOrCreateInventory(sku);
        inv.setLowStockThreshold(request.getThreshold());
        return toInventoryResponse(inventoryRepository.save(inv));
    }

    // ============================================================
    // INV-005: Stock Adjustment
    // ============================================================

    @Override
    @Transactional
    public StockAdjustmentResponse adjustStock(StockAdjustmentRequest request) {
        Sku sku = findSkuOrThrow(request.getSkuId());
        Inventory inv = getOrCreateInventory(sku);

        int beforePhysical = inv.getPhysicalQuantity();
        int afterPhysical = Math.max(0, beforePhysical + request.getQuantityChange());
        int beforeAvailable = inv.getAvailableQuantity();
        int afterAvailable = Math.max(0, beforeAvailable + request.getQuantityChange());

        inv.setPhysicalQuantity(afterPhysical);
        inv.setAvailableQuantity(afterAvailable);
        inventoryRepository.save(inv);

        // Đồng bộ lại Sku.stockQuantity
        sku.setStockQuantity(afterAvailable);
        skuRepository.save(sku);

        String adjustedBy = resolveCurrentUserId();

        StockAdjustment adjustment = stockAdjustmentRepository.save(
                StockAdjustment.builder()
                        .sku(sku)
                        .adjustedBy(adjustedBy)
                        .quantityChange(request.getQuantityChange())
                        .reason(request.getReason())
                        .beforeQuantity(beforePhysical)
                        .afterQuantity(afterPhysical)
                        .build());

        logMovement(sku, StockMovementType.ADJUSTMENT,
                Math.abs(request.getQuantityChange()),
                StockReferenceType.ADJUSTMENT, String.valueOf(adjustment.getId()),
                beforeAvailable, afterAvailable,
                request.getReason());

        return toAdjustmentResponse(adjustment);
    }

    // ============================================================
    // INV-006: Inventory Reports
    // ============================================================

    @Override
    public InventoryResponse getInventoryBySkuId(Long skuId) {
        Sku sku = findSkuOrThrow(skuId);
        return toInventoryResponse(getOrCreateInventory(sku));
    }

    @Override
    public StockOnHandResponse getStockOnHand() {
        List<Inventory> all = inventoryRepository.findAll();
        List<InventoryResponse> items = all.stream()
                .map(this::toInventoryResponse)
                .collect(Collectors.toList());

        return StockOnHandResponse.builder()
                .items(items)
                .totalSkus(all.size())
                .totalPhysical(all.stream().mapToInt(Inventory::getPhysicalQuantity).sum())
                .totalAvailable(all.stream().mapToInt(Inventory::getAvailableQuantity).sum())
                .totalReserved(all.stream().mapToInt(Inventory::getReservedQuantity).sum())
                .totalDefect(all.stream().mapToInt(Inventory::getDefectQuantity).sum())
                .build();
    }

    @Override
    public List<StockMovementResponse> getStockMovements(Long skuId) {
        findSkuOrThrow(skuId); // Validate SKU exists
        return stockMovementRepository.findBySkuIdOrderByCreatedAtDesc(skuId)
                .stream()
                .map(this::toMovementResponse)
                .collect(Collectors.toList());
    }

    @Override
    public InventoryValuationResponse getInventoryValuation() {
        List<Inventory> all = inventoryRepository.findAll();

        List<InventoryValuationResponse.SkuValuationResponse> items = all.stream()
                .map(inv -> {
                    Sku sku = inv.getSku();
                    BigDecimal unitPrice = (sku.getPrice() != null) ? sku.getPrice() : BigDecimal.ZERO;
                    BigDecimal totalVal = unitPrice.multiply(BigDecimal.valueOf(inv.getAvailableQuantity()));

                    return InventoryValuationResponse.SkuValuationResponse.builder()
                            .skuId(sku.getId())
                            .skuCode(sku.getCode())
                            .productName(sku.getProduct() != null ? sku.getProduct().getName() : null)
                            .availableQuantity(inv.getAvailableQuantity())
                            .unitPrice(unitPrice)
                            .totalValue(totalVal)
                            .build();
                })
                .collect(Collectors.toList());

        BigDecimal grandTotal = items.stream()
                .map(InventoryValuationResponse.SkuValuationResponse::getTotalValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return InventoryValuationResponse.builder()
                .items(items)
                .totalValue(grandTotal)
                .build();
    }

    // ============================================================
    // Private Helpers Mapping
    // ============================================================

    private Sku findSkuOrThrow(Long skuId) {
        return skuRepository.findById(skuId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy SKU ID: " + skuId));
    }

    private String resolveCurrentUserId() {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            return userRepository.findByUsername(username)
                    .map(User::getId)
                    .orElse(null);
        } catch (Exception e) {
            return null;
        }
    }

    private void logMovement(Sku sku, StockMovementType type, int qty,
                             StockReferenceType refType, String refId,
                             int before, int after, String note) {
        stockMovementRepository.save(
                StockMovement.builder()
                        .sku(sku)
                        .movementType(type)
                        .quantity(qty)
                        .referenceType(refType)
                        .referenceId(refId)
                        .beforeQuantity(before)
                        .afterQuantity(after)
                        .note(note)
                        .build());
    }

    private InventoryResponse toInventoryResponse(Inventory inv) {
        Sku sku = inv.getSku();
        boolean isLow = inv.getLowStockThreshold() > 0
                && inv.getAvailableQuantity() < inv.getLowStockThreshold();

        Long categoryId = (sku.getProduct() != null && sku.getProduct().getCategory() != null) ? sku.getProduct().getCategory().getId() : null;
        Long brandId = (sku.getProduct() != null && sku.getProduct().getBrand() != null) ? sku.getProduct().getBrand().getId() : null;

        return InventoryResponse.builder()
                .id(inv.getId())
                .skuId(sku.getId())
                .skuCode(sku.getCode())
                .productName(sku.getProduct() != null ? sku.getProduct().getName() : null)
                .categoryId(categoryId)
                .brandId(brandId)
                .physicalQuantity(inv.getPhysicalQuantity())
                .availableQuantity(inv.getAvailableQuantity())
                .reservedQuantity(inv.getReservedQuantity())
                .defectQuantity(inv.getDefectQuantity())
                .lowStockThreshold(inv.getLowStockThreshold())
                .lowStock(isLow)
                .build();
    }

    private StockMovementResponse toMovementResponse(StockMovement m) {
        return StockMovementResponse.builder()
                .id(m.getId())
                .skuId(m.getSku().getId())
                .skuCode(m.getSku().getCode())
                .movementType(m.getMovementType())
                .quantity(m.getQuantity())
                .referenceType(m.getReferenceType())
                .referenceId(m.getReferenceId())
                .beforeQuantity(m.getBeforeQuantity())
                .afterQuantity(m.getAfterQuantity())
                .note(m.getNote())
                .createdAt(m.getCreatedAt())
                .build();
    }

    private StockAdjustmentResponse toAdjustmentResponse(StockAdjustment adj) {
        return StockAdjustmentResponse.builder()
                .id(adj.getId())
                .skuId(adj.getSku().getId())
                .skuCode(adj.getSku().getCode())
                .adjustedBy(adj.getAdjustedBy())
                .quantityChange(adj.getQuantityChange())
                .reason(adj.getReason())
                .beforeQuantity(adj.getBeforeQuantity())
                .afterQuantity(adj.getAfterQuantity())
                .createdAt(adj.getCreatedAt())
                .build();
    }
}