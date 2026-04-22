// ============================================================
// SupplierResponse.java — Full response (dùng trong detail view)
// ============================================================
package com.example.clothingstore.dtos.supplier.response;

import java.time.LocalDateTime;

/**
 * Response đầy đủ thông tin nhà cung cấp.
 * Dùng trong: GET /suppliers/{id}, POST /suppliers, PUT /suppliers/{id}
 */
public record SupplierResponse(
        Long id,
        String name,
        String contactPerson,
        String phone,
        String email,
        String address,
        String taxCode,
        Boolean isActive,
        Integer totalGrnCount,      // Số phiếu nhập đã tạo (để hiển thị dashboard)
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}