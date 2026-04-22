package com.example.clothingstore.service.impl;

import com.example.clothingstore.dtos.PagedResponse;
import com.example.clothingstore.dtos.gooodsReceipt.request.CreateGoodsReceiptRequest;
import com.example.clothingstore.dtos.gooodsReceipt.request.UpdateGoodsReceiptRequest;
import com.example.clothingstore.dtos.gooodsReceipt.response.GoodsReceiptItemResponse;
import com.example.clothingstore.dtos.gooodsReceipt.response.GoodsReceiptResponse;
import com.example.clothingstore.entity.*;
import com.example.clothingstore.entity.Enum.GrnStatus;
import com.example.clothingstore.entity.Enum.StockMovementType;
import com.example.clothingstore.entity.Enum.StockReferenceType;
import com.example.clothingstore.exception.AppException;
import com.example.clothingstore.exception.ErrorCode;
import com.example.clothingstore.repository.*;
import com.example.clothingstore.service.GoodsReceiptService;
import com.example.clothingstore.service.InventoryService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
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
    SupplierRepository supplierRepository;  // V10: thêm Supplier

    @Override
    public PagedResponse<GoodsReceiptResponse> getAllGoodsReceiptsPaged(
            GrnStatus status, LocalDate fromDate, LocalDate toDate, int page, int size) {

        LocalDateTime fromDateTime = (fromDate != null) ? fromDate.atStartOfDay() : null;
        LocalDateTime toDateTime = (toDate != null) ? toDate.atTime(23, 59, 59, 999999999) : null;
        Pageable pageable = PageRequest.of(page, size);

        Page<GoodsReceipt> grnPage = goodsReceiptRepository.findAllWithFilters(
                status, fromDateTime, toDateTime, pageable);

        List<GoodsReceiptResponse> content = grnPage.getContent().stream()
                .map(this::toGrnResponse)
                .collect(Collectors.toList());

        return PagedResponse.<GoodsReceiptResponse>builder()
                .content(content)
                .page(grnPage.getNumber())
                .size(grnPage.getSize())
                .totalElements(grnPage.getTotalElements())
                .totalPages(grnPage.getTotalPages())
                .last(grnPage.isLast())
                .first(grnPage.isFirst())
                .build();
    }

    // ============================================================
    // INV-002 + V10: Tạo phiếu nhập kho — bắt buộc gán Supplier
    // ============================================================
    @Override
    @Transactional
    public GoodsReceiptResponse createGoodsReceipt(CreateGoodsReceiptRequest request) {
        String userId = resolveCurrentUserId();

        // V10: Validate và lấy Supplier
        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new AppException(ErrorCode.SUPPLIER_NOT_FOUND));

        if (Boolean.FALSE.equals(supplier.getIsActive())) {
            throw new AppException(ErrorCode.SUPPLIER_NOT_FOUND);
        }

        GoodsReceipt grn = goodsReceiptRepository.save(
                GoodsReceipt.builder()
                        .createdBy(userId)
                        .supplier(supplier)           // V10: gắn supplier
                        .note(request.getNote())
                        .status(GrnStatus.PENDING)
                        .build());

        for (CreateGoodsReceiptRequest.GrnItemRequest itemReq : request.getItems()) {
            Sku sku = skuRepository.findById(itemReq.getSkuId())
                    .orElseThrow(() -> new RuntimeException(
                            "Không tìm thấy SKU ID: " + itemReq.getSkuId()));

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
                            .importPrice(itemReq.getImportPrice())
                            .build());
        }

        GoodsReceipt savedGrn = goodsReceiptRepository.findByIdWithItems(grn.getId()).orElse(grn);
        return toGrnResponse(savedGrn);
    }

    // ============================================================
    // Sửa phiếu nhập (chỉ khi PENDING)
    // ============================================================
    @Override
    @Transactional
    public GoodsReceiptResponse updateGoodsReceipt(Long grnId, UpdateGoodsReceiptRequest request) {
        GoodsReceipt grn = goodsReceiptRepository.findByIdWithItems(grnId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy GRN ID: " + grnId));

        if (grn.getStatus() == GrnStatus.CONFIRMED) {
            throw new RuntimeException("Không thể sửa phiếu nhập đã xác nhận!");
        }

        // V10: Cho phép đổi supplier khi update (nếu request có supplierId)
        if (request.getSupplierId() != null) {
            Supplier supplier = supplierRepository.findById(request.getSupplierId())
                    .orElseThrow(() -> new AppException(ErrorCode.SUPPLIER_NOT_FOUND));
            grn.setSupplier(supplier);
        }

        grn.setNote(request.getNote());

        goodsReceiptItemRepository.deleteAll(grn.getItems());
        grn.getItems().clear();

        for (UpdateGoodsReceiptRequest.GrnItemRequest itemReq : request.getItems()) {
            Sku sku = skuRepository.findById(itemReq.getSkuId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy SKU ID: " + itemReq.getSkuId()));

            if (itemReq.getQuantityPassed() + itemReq.getQuantityFailed() != itemReq.getQuantityReceived()) {
                throw new RuntimeException("Dữ liệu QC không hợp lệ cho SKU " + itemReq.getSkuId());
            }

            goodsReceiptItemRepository.save(
                    GoodsReceiptItem.builder()
                            .goodsReceipt(grn)
                            .sku(sku)
                            .quantityReceived(itemReq.getQuantityReceived())
                            .quantityPassed(itemReq.getQuantityPassed())
                            .quantityFailed(itemReq.getQuantityFailed())
                            .importPrice(itemReq.getImportPrice())
                            .build());
        }

        goodsReceiptRepository.save(grn);
        GoodsReceipt updated = goodsReceiptRepository.findByIdWithItems(grnId).orElse(grn);
        return toGrnResponse(updated);
    }

    // ============================================================
    // INV-002 + INV-003: Xác nhận phiếu nhập → cập nhật tồn kho + giá nhập bình quân
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

            if (item.getQuantityPassed() > 0) {
                if (item.getImportPrice() != null && item.getImportPrice().compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal currentImportPrice = sku.getImportPrice() != null ? sku.getImportPrice() : BigDecimal.ZERO;
                    int currentStock = inv.getAvailableQuantity();
                    int newQty = item.getQuantityPassed();
                    BigDecimal newImportPrice = item.getImportPrice();

                    BigDecimal totalCurrentValue = currentImportPrice.multiply(BigDecimal.valueOf(currentStock));
                    BigDecimal totalNewValue = newImportPrice.multiply(BigDecimal.valueOf(newQty));
                    int totalQty = currentStock + newQty;

                    BigDecimal avgImportPrice = totalQty > 0
                            ? totalCurrentValue.add(totalNewValue).divide(BigDecimal.valueOf(totalQty), 2, RoundingMode.HALF_UP)
                            : newImportPrice;

                    sku.setImportPrice(avgImportPrice);

                    if (sku.getProfitMargin() != null && sku.getProfitMargin().compareTo(BigDecimal.ZERO) > 0) {
                        BigDecimal sellingPrice = avgImportPrice.multiply(
                                BigDecimal.ONE.add(sku.getProfitMargin().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP))
                        ).setScale(0, RoundingMode.CEILING);
                        sku.setPrice(sellingPrice);
                    }
                }

                inv.setPhysicalQuantity(inv.getPhysicalQuantity() + item.getQuantityPassed());
                inv.setAvailableQuantity(inv.getAvailableQuantity() + item.getQuantityPassed());
            }

            if (item.getQuantityFailed() > 0) {
                inv.setDefectQuantity(inv.getDefectQuantity() + item.getQuantityFailed());
            }

            inventoryRepository.save(inv);
            sku.setStockQuantity(inv.getAvailableQuantity());
            skuRepository.save(sku);

            if (item.getQuantityPassed() > 0) {
                // Ghi chú bổ sung tên NCC vào StockMovement để truy vết
                String supplierNote = grn.getSupplier() != null
                        ? " | NCC: " + grn.getSupplier().getName()
                        : "";
                stockMovementRepository.save(
                        StockMovement.builder()
                                .sku(sku)
                                .movementType(StockMovementType.IN)
                                .quantity(item.getQuantityPassed())
                                .referenceType(StockReferenceType.GRN)
                                .referenceId(String.valueOf(grnId))
                                .beforeQuantity(beforeAvailable)
                                .afterQuantity(inv.getAvailableQuantity())
                                .note("Nhập kho từ GRN #" + grnId + " - Giá nhập: " + item.getImportPrice() + supplierNote)
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
                            .skuName(item.getSku() != null ? buildSkuName(item.getSku()) : null)
                            .productName(item.getSku().getProduct() != null
                                    ? item.getSku().getProduct().getName() : null)
                            .quantityReceived(item.getQuantityReceived())
                            .quantityPassed(item.getQuantityPassed())
                            .quantityFailed(item.getQuantityFailed())
                            .importPrice(item.getImportPrice())
                            .defectRate(defectRate)
                            .build();
                })
                .collect(Collectors.toList());

        int totalReceived = grn.getItems().stream().mapToInt(GoodsReceiptItem::getQuantityReceived).sum();
        int totalPassed = grn.getItems().stream().mapToInt(GoodsReceiptItem::getQuantityPassed).sum();
        int totalFailed = grn.getItems().stream().mapToInt(GoodsReceiptItem::getQuantityFailed).sum();

        // V10: Map supplier info
        Long supplierId = null;
        String supplierName = null;
        String supplierPhone = null;
        if (grn.getSupplier() != null) {
            supplierId = grn.getSupplier().getId();
            supplierName = grn.getSupplier().getName();
            supplierPhone = grn.getSupplier().getPhone();
        }

        return GoodsReceiptResponse.builder()
                .id(grn.getId())
                .createdBy(grn.getCreatedBy())
                .status(grn.getStatus())
                .note(grn.getNote())
                .createdAt(grn.getCreatedAt())
                .items(itemResponses)
                .supplierId(supplierId)
                .supplierName(supplierName)
                .supplierPhone(supplierPhone)
                .totalReceived(totalReceived)
                .totalPassed(totalPassed)
                .totalFailed(totalFailed)
                .build();
    }

    private String buildSkuName(Sku sku) {
        if (sku.getValues() == null || sku.getValues().isEmpty()) return sku.getCode();
        return sku.getValues().stream()
                .map(v -> v.getOptionValue().getValue())
                .collect(Collectors.joining(" - "));
    }
}