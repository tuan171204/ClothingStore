package com.example.clothingstore.service.impl;

import com.example.clothingstore.dtos.gooodsReceipt.request.CreateGoodsReceiptRequest;
import com.example.clothingstore.dtos.gooodsReceipt.response.GoodsReceiptItemResponse;
import com.example.clothingstore.dtos.gooodsReceipt.response.GoodsReceiptResponse;
import com.example.clothingstore.entity.*;
import com.example.clothingstore.entity.Enum.GrnStatus;
import com.example.clothingstore.entity.Enum.StockMovementType;
import com.example.clothingstore.entity.Enum.StockReferenceType;
import com.example.clothingstore.repository.*;
import com.example.clothingstore.service.GoodsReceiptService;
import com.example.clothingstore.service.InventoryService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class GoodsReceiptServiceImpl implements GoodsReceiptService {

    GoodsReceiptRepository goodsReceiptRepository;
    GoodsReceiptItemRepository goodsReceiptItemRepository;
    SkuRepository skuRepository;
    InventoryRepository inventoryRepository;
    StockMovementRepository stockMovementRepository;
    UserRepository userRepository;
    InventoryService inventoryService;

    // ============================================================
    // INV-002: Tạo phiếu nhập kho
    // ============================================================

    @Override
    @Transactional
    public GoodsReceiptResponse createGoodsReceipt(CreateGoodsReceiptRequest request) {
        String userId = resolveCurrentUserId();

        // 1. Tạo header GRN
        GoodsReceipt grn = goodsReceiptRepository.save(
                GoodsReceipt.builder()
                        .createdBy(userId)
                        .note(request.getNote())
                        .status(GrnStatus.PENDING)
                        .build());

        // 2. Validate và tạo từng dòng hàng
        for (CreateGoodsReceiptRequest.GrnItemRequest itemReq : request.getItems()) {
            Sku sku = skuRepository.findById(itemReq.getSkuId())
                    .orElseThrow(() -> new RuntimeException(
                            "Không tìm thấy SKU ID: " + itemReq.getSkuId()));

            // INV-003 Validation: passed + failed phải = received
            if (itemReq.getQuantityPassed() + itemReq.getQuantityFailed() != itemReq.getQuantityReceived()) {
                throw new RuntimeException(
                        "Dữ liệu QC không hợp lệ cho SKU " + itemReq.getSkuId()
                                + ": quantity_passed + quantity_failed phải bằng quantity_received");
            }

            goodsReceiptItemRepository.save(
                    GoodsReceiptItem.builder()
                            .goodsReceipt(grn)
                            .sku(sku)
                            .quantityReceived(itemReq.getQuantityReceived())
                            .quantityPassed(itemReq.getQuantityPassed())
                            .quantityFailed(itemReq.getQuantityFailed())
                            .build());
        }

        // Reload để lấy đủ items
        GoodsReceipt savedGrn = goodsReceiptRepository.findByIdWithItems(grn.getId()).orElse(grn);
        return toGrnResponse(savedGrn);
    }

    // ============================================================
    // INV-002 + INV-003: Xác nhận phiếu nhập → cập nhật tồn kho
    // ============================================================

    @Override
    @Transactional
    public GoodsReceiptResponse confirmGoodsReceipt(Long grnId) {
        GoodsReceipt grn = goodsReceiptRepository.findByIdWithItems(grnId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy GRN ID: " + grnId));

        if (grn.getStatus() == GrnStatus.CONFIRMED) {
            throw new RuntimeException("GRN #" + grnId + " đã được xác nhận rồi, không thể xác nhận lại!");
        }

        for (GoodsReceiptItem item : grn.getItems()) {
            Sku sku = item.getSku();
            Inventory inv = inventoryService.getOrCreateInventory(sku);

            int beforeAvailable = inv.getAvailableQuantity();

            // INV-002: Cộng hàng đạt QC vào physical + available
            if (item.getQuantityPassed() > 0) {
                inv.setPhysicalQuantity(inv.getPhysicalQuantity() + item.getQuantityPassed());
                inv.setAvailableQuantity(inv.getAvailableQuantity() + item.getQuantityPassed());
            }

            // INV-003: Cộng hàng lỗi vào defect bucket (KHÔNG vào physical hay available)
            if (item.getQuantityFailed() > 0) {
                inv.setDefectQuantity(inv.getDefectQuantity() + item.getQuantityFailed());
            }

            inventoryRepository.save(inv);

            // Đồng bộ lại Sku.stockQuantity để các flow cũ vẫn hoạt động
            sku.setStockQuantity(inv.getAvailableQuantity());
            skuRepository.save(sku);

            // Ghi StockMovement cho hàng đạt QC
            if (item.getQuantityPassed() > 0) {
                stockMovementRepository.save(
                        StockMovement.builder()
                                .sku(sku)
                                .movementType(StockMovementType.IN)
                                .quantity(item.getQuantityPassed())
                                .referenceType(StockReferenceType.GRN)
                                .referenceId(String.valueOf(grnId))
                                .beforeQuantity(beforeAvailable)
                                .afterQuantity(inv.getAvailableQuantity())
                                .note("Nhập kho từ GRN #" + grnId + " - Hàng đạt QC")
                                .build());
            }
        }

        grn.setStatus(GrnStatus.CONFIRMED);
        goodsReceiptRepository.save(grn);

        return toGrnResponse(grn);
    }

    @Override
    public GoodsReceiptResponse getGoodsReceiptById(Long id) {
        GoodsReceipt grn = goodsReceiptRepository.findByIdWithItems(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy GRN ID: " + id));
        return toGrnResponse(grn);
    }

    @Override
    public List<GoodsReceiptResponse> getAllGoodsReceipts() {
        return goodsReceiptRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toGrnResponse)
                .collect(Collectors.toList());
    }

    // ============================================================
    // Private Helpers
    // ============================================================

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

    private GoodsReceiptResponse toGrnResponse(GoodsReceipt grn) {
        List<GoodsReceiptItemResponse> itemResponses = grn.getItems().stream()
                .map(item -> {
                    double defectRate = item.getQuantityReceived() > 0
                            ? (double) item.getQuantityFailed() / item.getQuantityReceived()
                            : 0.0;

                    return GoodsReceiptItemResponse.builder()
                            .id(item.getId())
                            .skuId(item.getSku().getId())
                            .skuCode(item.getSku().getCode())
                            .productName(item.getSku().getProduct() != null
                                    ? item.getSku().getProduct().getName() : null)
                            .quantityReceived(item.getQuantityReceived())
                            .quantityPassed(item.getQuantityPassed())
                            .quantityFailed(item.getQuantityFailed())
                            .defectRate(defectRate)
                            .build();
                })
                .collect(Collectors.toList());

        int totalReceived = grn.getItems().stream().mapToInt(GoodsReceiptItem::getQuantityReceived).sum();
        int totalPassed   = grn.getItems().stream().mapToInt(GoodsReceiptItem::getQuantityPassed).sum();
        int totalFailed   = grn.getItems().stream().mapToInt(GoodsReceiptItem::getQuantityFailed).sum();

        return GoodsReceiptResponse.builder()
                .id(grn.getId())
                .createdBy(grn.getCreatedBy())
                .status(grn.getStatus())
                .note(grn.getNote())
                .createdAt(grn.getCreatedAt())
                .items(itemResponses)
                .totalReceived(totalReceived)
                .totalPassed(totalPassed)
                .totalFailed(totalFailed)
                .build();
    }
}