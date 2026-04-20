package com.example.clothingstore.controller;

import com.example.clothingstore.dtos.ApiResponse;
import com.example.clothingstore.dtos.PagedResponse;
import com.example.clothingstore.dtos.address.response.AddressResponse;
import com.example.clothingstore.dtos.user.request.*;
import com.example.clothingstore.dtos.user.response.*;
import com.example.clothingstore.service.impl.UserManagementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Unified controller for Customer & Staff management.
 *
 * Nhiệm vụ tầng Controller:
 *   - Nhận HTTP request, parse params/body
 *   - Xác thực phân quyền (@PreAuthorize)
 *   - Delegate 100% business logic sang UserManagementService
 *   - Trả về HTTP response
 *
 * KHÔNG: inject repository, inject mapper, gọi DB trực tiếp.
 *
 * Security matrix:
 * ┌──────────────────────────────────────────┬─────────┬───────┬───────────┐
 * │ Operation                                │ STAFF   │ ADMIN │ SUPER_ADM │
 * ├──────────────────────────────────────────┼─────────┼───────┼───────────┤
 * │ List/search customers                    │   ✓     │  ✓    │    ✓      │
 * │ View customer detail                     │   ✓     │  ✓    │    ✓      │
 * │ View user addresses                      │   ✓     │  ✓    │    ✓      │
 * │ Enable/disable user                      │   ✗     │  ✓    │    ✓      │
 * │ Assign role                              │   ✗     │  ✓    │    ✓      │
 * │ Create / Update / Delete staff           │   ✗     │  ✓    │    ✓      │
 * └──────────────────────────────────────────┴─────────┴───────┴───────────┘
 *
 * Base URL: /api/v1/management
 */
@RestController
@RequestMapping("${api.prefix}/management")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "Admin APIs for customer & staff management")
@SecurityRequirement(name = "Bearer Authentication")
public class UserManagementController {

    private final UserManagementService userManagementService;

    // ════════════════════════════════════════════════════════
    // CUSTOMER ENDPOINTS
    // ════════════════════════════════════════════════════════

    /**
     * GET /management/customers
     * ?keyword=john&active=true&provider=GOOGLE&fromDate=2026-01-01&page=0&size=20
     */
    @GetMapping("/customers")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "List & search customers",
            description = "Paginated customer list. Filter by keyword (name/email/phone), " +
                    "active status, auth provider, registration date range.")
    public ResponseEntity<PagedResponse<UserDetailResponse>> listCustomers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String provider,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        UserFilterRequest filter = UserFilterRequest.builder()
                .keyword(keyword).role("USER").active(active)
                .provider(provider).fromDate(fromDate).toDate(toDate)
                .page(page).size(size).build();
        return ResponseEntity.ok(userManagementService.getUsers(filter));
    }

    /**
     * GET /management/customers/{userId}
     */
    @GetMapping("/customers/{userId}")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Customer detail",
            description = "Full customer profile including total orders, total spending, membership tier.")
    public ResponseEntity<UserDetailResponse> getCustomerDetail(@PathVariable String userId) {
        return ResponseEntity.ok(userManagementService.getUserDetail(userId));
    }

    // ════════════════════════════════════════════════════════
    // STAFF ENDPOINTS
    // ════════════════════════════════════════════════════════

    /**
     * GET /management/staff
     * ?keyword=&role=STAFF&active=true&page=0&size=20
     *
     * Khi không truyền role, service sẽ trả về cả STAFF lẫn ADMIN.
     */
    @GetMapping("/staff")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "List all staff accounts")
    public ResponseEntity<PagedResponse<UserDetailResponse>> listStaff(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        UserFilterRequest filter = UserFilterRequest.builder()
                .keyword(keyword).role(role).active(active)
                .page(page).size(size).build();
        return ResponseEntity.ok(userManagementService.getStaff(filter));
    }

    /**
     * POST /management/staff
     */
    @PostMapping("/staff")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Create staff account")
    public ResponseEntity<UserDetailResponse> createStaff(
            @Valid @RequestBody CreateStaffRequest request) {
        return ResponseEntity.status(201)
                .body(userManagementService.createStaff(request));
    }

    /**
     * PUT /management/staff/{userId}
     */
    @PutMapping("/staff/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Update staff account")
    public ResponseEntity<UserDetailResponse> updateStaff(
            @PathVariable String userId,
            @Valid @RequestBody UpdateStaffRequest request) {
        return ResponseEntity.ok(
                userManagementService.updateStaff(userId, request, resolveCurrentUserId()));
    }

    /**
     * DELETE /management/staff/{userId}
     */
    @DeleteMapping("/staff/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Soft-delete staff account")
    public ResponseEntity<Void> softDeleteStaff(@PathVariable String userId) {
        userManagementService.softDeleteStaff(userId, resolveCurrentUserId());
        return ResponseEntity.noContent().build();
    }

    // ════════════════════════════════════════════════════════
    // SHARED: STATUS, ROLE, ADDRESSES
    // ════════════════════════════════════════════════════════

    /**
     * PATCH /management/users/{userId}/status
     * Body: { "active": false, "reason": "Spam account" }
     */
    @PatchMapping("/users/{userId}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Enable / Disable user account")
    public ResponseEntity<UserDetailResponse> updateUserStatus(
            @PathVariable String userId,
            @Valid @RequestBody UpdateUserStatusRequest request) {
        return ResponseEntity.ok(
                userManagementService.updateUserStatus(userId, request, resolveCurrentUserId()));
    }

    /**
     * PATCH /management/users/{userId}/role
     * Body: { "role": "STAFF" }
     */
    @PatchMapping("/users/{userId}/role")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Assign role to user")
    public ResponseEntity<UserDetailResponse> assignRole(
            @PathVariable String userId,
            @RequestBody AssignRoleRequest request) {
        return ResponseEntity.ok(
                userManagementService.assignRole(userId, request.getRole()));
    }

    /**
     * GET /management/users/{userId}/addresses
     *
     * Lấy toàn bộ sổ địa chỉ của 1 user theo ID.
     * Dùng cho Admin xem địa chỉ của khách hàng hoặc nhân viên.
     */
    @GetMapping("/users/{userId}/addresses")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Get user address book",
            description = "Returns all saved delivery addresses for the specified user.")
    public ApiResponse<List<AddressResponse>> getUserAddresses(@PathVariable String userId) {
        return ApiResponse.<List<AddressResponse>>builder()
                .result(userManagementService.getUserAddresses(userId))
                .build();
    }

    // ════════════════════════════════════════════════════════
    // PRIVATE HELPER
    // ════════════════════════════════════════════════════════

    /**
     * Lấy userId của người đang gọi API (dùng cho các thao tác cần biết "ai đang thực hiện").
     * Đây là thông tin xác thực — thuộc trách nhiệm của Controller layer.
     */
    private String resolveCurrentUserId() {
        return userManagementService.resolveCurrentUserId(
                SecurityContextHolder.getContext().getAuthentication().getName()
        );
    }
}