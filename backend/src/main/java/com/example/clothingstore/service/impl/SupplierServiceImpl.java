package com.example.clothingstore.service.impl;

import com.example.clothingstore.dtos.PagedResponse;
import com.example.clothingstore.dtos.supplier.request.SupplierRequest;
import com.example.clothingstore.dtos.supplier.response.SupplierResponse;
import com.example.clothingstore.dtos.supplier.response.SupplierSummaryResponse;
import com.example.clothingstore.entity.Supplier;
import com.example.clothingstore.exception.AppException;
import com.example.clothingstore.exception.ErrorCode;
import com.example.clothingstore.mapper.SupplierMapper;
import com.example.clothingstore.repository.SupplierRepository;
import com.example.clothingstore.service.SupplierService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SupplierServiceImpl implements SupplierService {

    private final SupplierRepository supplierRepository;
    private final SupplierMapper supplierMapper;

    // ─────────────────────────────────────────────────
    // CREATE
    // ─────────────────────────────────────────────────
    @Override
    @Transactional
    public SupplierResponse createSupplier(SupplierRequest request) {
        // Kiểm tra mã số thuế trùng (nếu có cung cấp)
        if (request.taxCode() != null && !request.taxCode().isBlank()
                && supplierRepository.existsByTaxCode(request.taxCode())) {
            throw new AppException(ErrorCode.SUPPLIER_TAX_CODE_ALREADY_EXISTS);
        }

        Supplier supplier = supplierMapper.toEntity(request);
        Supplier saved = supplierRepository.save(supplier);
        log.info("Tạo nhà cung cấp mới: id={}, name={}", saved.getId(), saved.getName());

        return buildFullResponse(saved);
    }

    // ─────────────────────────────────────────────────
    // UPDATE
    // ─────────────────────────────────────────────────
    @Override
    @Transactional
    public SupplierResponse updateSupplier(Long id, SupplierRequest request) {
        Supplier supplier = findOrThrow(id);

        // Kiểm tra MST trùng với NCC khác
        if (request.taxCode() != null && !request.taxCode().isBlank()
                && supplierRepository.existsByTaxCodeAndIdNot(request.taxCode(), id)) {
            throw new AppException(ErrorCode.SUPPLIER_TAX_CODE_ALREADY_EXISTS);
        }

        supplierMapper.updateEntityFromRequest(request, supplier);
        Supplier saved = supplierRepository.save(supplier);
        log.info("Cập nhật nhà cung cấp: id={}", id);

        return buildFullResponse(saved);
    }

    // ─────────────────────────────────────────────────
    // GET BY ID
    // ─────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public SupplierResponse getSupplierById(Long id) {
        return buildFullResponse(findOrThrow(id));
    }

    // ─────────────────────────────────────────────────
    // SOFT DELETE
    // ─────────────────────────────────────────────────
    @Override
    @Transactional
    public void deleteSupplier(Long id) {
        Supplier supplier = findOrThrow(id);
        supplier.setIsActive(false);
        supplierRepository.save(supplier);
        log.info("Soft-delete nhà cung cấp: id={}", id);
    }

    // ─────────────────────────────────────────────────
    // PAGINATED LIST
    // ─────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public PagedResponse<SupplierResponse> getSuppliersWithFilter(
            String keyword, boolean activeOnly, int page, int size) {

        Pageable pageable = PageRequest.of(page, size);
        String kw = (keyword != null && !keyword.isBlank()) ? keyword.trim() : "";

        Page<Supplier> supplierPage = activeOnly
                ? supplierRepository.findActiveByKeyword(kw, pageable)
                : supplierRepository.findAllByKeyword(kw, pageable);

        List<SupplierResponse> content = supplierPage.getContent().stream()
                .map(this::buildFullResponse)
                .collect(Collectors.toList());

        return PagedResponse.<SupplierResponse>builder()
                .content(content)
                .page(supplierPage.getNumber())
                .size(supplierPage.getSize())
                .totalElements(supplierPage.getTotalElements())
                .totalPages(supplierPage.getTotalPages())
                .first(supplierPage.isFirst())
                .last(supplierPage.isLast())
                .build();
    }

    // ─────────────────────────────────────────────────
    // DROPDOWN LIST (active only)
    // ─────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public List<SupplierSummaryResponse> getActiveSuppliersSummary() {
        return supplierRepository.findByIsActiveTrueOrderByNameAsc()
                .stream()
                .map(supplierMapper::toSummaryResponse)
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────
    private Supplier findOrThrow(Long id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.SUPPLIER_NOT_FOUND));
    }

    /**
     * Map entity → FullResponse, bổ sung totalGrnCount từ collection size.
     * Lazy load được tránh vì chúng ta chỉ gọi size() (đủ với Hibernate).
     */
    private SupplierResponse buildFullResponse(Supplier supplier) {
        SupplierResponse base = supplierMapper.toResponse(supplier);
        int grnCount = supplier.getGoodsReceipts() != null
                ? supplier.getGoodsReceipts().size()
                : 0;

        return new SupplierResponse(
                base.id(),
                base.name(),
                base.contactPerson(),
                base.phone(),
                base.email(),
                base.address(),
                base.taxCode(),
                base.isActive(),
                grnCount,
                base.createdAt(),
                base.updatedAt()
        );
    }
}