package com.example.clothingstore.controller;

import com.example.clothingstore.dtos.PagedResponse;
import com.example.clothingstore.dtos.user.request.*;
import com.example.clothingstore.dtos.user.response.*;
import com.example.clothingstore.entity.User;
import com.example.clothingstore.repository.UserRepository;
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
 * Security matrix:
 * ┌────────────────────────────────┬─────────┬───────┬───────────┐
 * │ Operation                      │ STAFF   │ ADMIN │ SUPER_ADM │
 * ├────────────────────────────────┼─────────┼───────┼───────────┤
 * │ List/search customers          │   ✓     │  ✓    │    ✓      │
 * │ View customer detail           │   ✓     │  ✓    │    ✓      │
 * │ Enable/disable customer        │   ✗     │  ✓    │    ✓      │
 * │ Create staff                   │   ✗     │  ✓    │    ✓      │
 * │ Update staff                   │   ✗     │  ✓    │    ✓      │
 * │ Soft-delete staff              │   ✗     │  ✓    │    ✓      │
 * │ Assign role                    │   ✗     │  ✓    │    ✓      │
 * └────────────────────────────────┴─────────┴───────┴───────────┘
 */
@RestController
@RequestMapping("${api.prefix}/management")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "Admin APIs for customer & staff management")
@SecurityRequirement(name = "Bearer Authentication")
public class UserManagementController {

    private final UserManagementService userManagementService;
    private final UserRepository        userRepository;

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
     * Returns customer detail with order history stats.
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
     * List all staff members (STAFF and ADMIN roles).
     */
    @GetMapping("/staff")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "List all staff accounts",
               description = "Returns STAFF and ADMIN role users with pagination.")
    public ResponseEntity<PagedResponse<UserDetailResponse>> listStaff(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role,  // STAFF or ADMIN
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        // Default to filtering all staff roles if none specified
        String resolvedRole = (role != null && !role.isBlank()) ? role : null;

        UserFilterRequest filter = UserFilterRequest.builder()
                .keyword(keyword).role(resolvedRole).active(active)
                .page(page).size(size).build();

        // If no specific role given, we need to get both STAFF and ADMIN
        // Simplest: call service twice and merge, or use IN clause in spec
        // Here we use a combined approach via a non-standard filter
        PagedResponse<UserDetailResponse> result = userManagementService.getUsers(filter);

        // Filter out customers from result if no role specified
        if (resolvedRole == null) {
            var staffOnly = result.getContent().stream()
                    .filter(u -> "STAFF".equals(u.getRole()) || "ADMIN".equals(u.getRole()))
                    .toList();
            return ResponseEntity.ok(PagedResponse.<UserDetailResponse>builder()
                    .content(staffOnly)
                    .page(result.getPage()).size(result.getSize())
                    .totalElements(result.getTotalElements())
                    .totalPages(result.getTotalPages())
                    .build());
        }
        return ResponseEntity.ok(result);
    }

    /**
     * POST /management/staff
     * Admin creates a new staff account.
     */
    @PostMapping("/staff")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Create staff account",
               description = "Creates a STAFF or ADMIN account. " +
                             "SUPER_ADMIN role cannot be assigned via this API.")
    public ResponseEntity<UserDetailResponse> createStaff(
            @Valid @RequestBody CreateStaffRequest request) {
        return ResponseEntity.status(201)
                .body(userManagementService.createStaff(request));
    }

    /**
     * PUT /management/staff/{userId}
     * Admin updates staff info or role.
     */
    @PutMapping("/staff/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Update staff account",
               description = "Update staff name, email, phone, role. " +
                             "Admin cannot change their own role.")
    public ResponseEntity<UserDetailResponse> updateStaff(
            @PathVariable String userId,
            @Valid @RequestBody UpdateStaffRequest request) {
        String currentUserId = resolveCurrentUserId();
        return ResponseEntity.ok(userManagementService.updateStaff(userId, request, currentUserId));
    }

    /**
     * DELETE /management/staff/{userId}
     * Soft delete staff account.
     */
    @DeleteMapping("/staff/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Soft-delete staff account",
               description = "Sets active=false. Preserves audit trail in orders and GRNs. " +
                             "Cannot delete SUPER_ADMIN or self.")
    public ResponseEntity<Void> softDeleteStaff(@PathVariable String userId) {
        String currentUserId = resolveCurrentUserId();
        userManagementService.softDeleteStaff(userId, currentUserId);
        return ResponseEntity.noContent().build();
    }

    // ════════════════════════════════════════════════════════
    // SHARED: STATUS & ROLE
    // ════════════════════════════════════════════════════════

    /**
     * PATCH /management/users/{userId}/status
     * Enable or disable any user (customer or staff).
     *
     * Body: { "active": false, "reason": "Spam account" }
     */
    @PatchMapping("/users/{userId}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Enable / Disable user account",
               description = "Toggles user active status. Disabled users cannot log in. " +
                             "Cannot disable SUPER_ADMIN or self.")
    public ResponseEntity<UserDetailResponse> updateUserStatus(
            @PathVariable String userId,
            @Valid @RequestBody UpdateUserStatusRequest request) {
        String currentUserId = resolveCurrentUserId();
        return ResponseEntity.ok(userManagementService.updateUserStatus(userId, request, currentUserId));
    }

    /**
     * PATCH /management/users/{userId}/role
     * Assign a new role to any user.
     *
     * Body: { "role": "STAFF" }
     */
    @PatchMapping("/users/{userId}/role")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Assign role to user",
               description = "Changes user role. Cannot assign SUPER_ADMIN role.")
    public ResponseEntity<UserDetailResponse> assignRole(
            @PathVariable String userId,
            @RequestBody java.util.Map<String, String> body) {
        String roleName = body.get("role");
        if (roleName == null || roleName.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(userManagementService.assignRole(userId, roleName));
    }

    // ════════════════════════════════════════════════════════
    // HELPER
    // ════════════════════════════════════════════════════════

    private String resolveCurrentUserId() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .map(User::getId)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }
}