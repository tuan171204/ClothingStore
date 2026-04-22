package com.example.clothingstore.dtos.supplier.response;

public record SupplierSummaryResponse(
        Long id,
        String name,
        String contactPerson,
        String phone,
        Boolean isActive
) {}