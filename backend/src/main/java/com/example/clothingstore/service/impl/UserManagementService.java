package com.example.clothingstore.service.impl;
 
import com.example.clothingstore.dtos.PagedResponse;
import com.example.clothingstore.dtos.user.request.*;
import com.example.clothingstore.dtos.user.response.*;
import com.example.clothingstore.entity.Role;
import com.example.clothingstore.entity.User;
import com.example.clothingstore.exception.AppException;
import com.example.clothingstore.exception.ErrorCode;
import com.example.clothingstore.mapper.UserMapper;
import com.example.clothingstore.repository.OrderRepository;
import com.example.clothingstore.repository.RoleRepository;
import com.example.clothingstore.repository.UserRepository;
import com.example.clothingstore.repository.specification.UserSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
 
import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;
 
@Slf4j
@Service
@RequiredArgsConstructor
public class UserManagementService {
 
    private final UserRepository   userRepository;
    private final RoleRepository   roleRepository;
    private final OrderRepository  orderRepository;
    private final UserMapper       userMapper;
    private final PasswordEncoder  passwordEncoder;
 
    // ════════════════════════════════════════════════════════
    // LIST & SEARCH
    // ════════════════════════════════════════════════════════
 
    /**
     * Paginated user list with dynamic filters.
     * Supports searching by name/email/phone, filtering by role/status/provider.
     */
    public PagedResponse<UserDetailResponse> getUsers(UserFilterRequest filter) {
        var spec = UserSpecification.buildSpec(filter);
        var pageable = PageRequest.of(
                filter.getPage(), filter.getSize(),
                Sort.by("createdAt").descending()
        );
        Page<User> page = userRepository.findAll(spec, pageable);
 
        return PagedResponse.<UserDetailResponse>builder()
                .content(page.getContent().stream()
                        .map(this::toDetailResponse)
                        .collect(Collectors.toList()))
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }
 
    /**
     * Get user detail with order stats (for admin viewing a customer profile).
     */
    public UserDetailResponse getUserDetail(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return toDetailResponse(user);
    }
 
    // ════════════════════════════════════════════════════════
    // STAFF MANAGEMENT
    // ════════════════════════════════════════════════════════
 
    /**
     * Admin creates a new staff account.
     *
     * Security rules:
     * - SUPER_ADMIN role cannot be assigned via this API
     * - Only ADMIN/SUPER_ADMIN can call this endpoint (enforced in controller)
     */
    @Transactional
    public UserDetailResponse createStaff(CreateStaffRequest request) {
        // Validate unique constraints
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new AppException(ErrorCode.USER_ALREADY_EXISTS);
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.USER_ALREADY_EXISTS);
        }
 
        // Prevent SUPER_ADMIN assignment via API
        if ("SUPER_ADMIN".equals(request.getRole())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
 
        Role role = roleRepository.findByName(request.getRole())
                .orElseThrow(() -> new RuntimeException("Role không tồn tại: " + request.getRole()));
 
        User staff = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber())
                .dob(request.getDob() != null ? request.getDob() : java.time.LocalDate.now())
                .active(true)
                .role(role)
                .provider(com.example.clothingstore.entity.Enum.AuthProvider.LOCAL)
                .build();
 
        User saved = userRepository.save(staff);
        log.info("[Staff Created] id={}, role={}", saved.getId(), request.getRole());
        return toDetailResponse(saved);
    }
 
    /**
     * Admin updates staff info (fullName, email, phone, role).
     * Cannot change own role to prevent privilege escalation.
     */
    @Transactional
    public UserDetailResponse updateStaff(String userId, UpdateStaffRequest request, String currentUserId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
 
        // Prevent SUPER_ADMIN demotion/promotion via API
        if ("SUPER_ADMIN".equals(request.getRole())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
 
        // Admin cannot change their own role (must be done by SUPER_ADMIN)
        if (userId.equals(currentUserId) && request.getRole() != null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
 
        if (request.getFullName()    != null) user.setFullName(request.getFullName());
        if (request.getEmail()       != null) user.setEmail(request.getEmail());
        if (request.getPhoneNumber() != null) user.setPhoneNumber(request.getPhoneNumber());
        if (request.getDob()         != null) user.setDob(request.getDob());
        if (request.getAvatar()      != null) user.setAvatar(request.getAvatar());
 
        if (request.getRole() != null && !request.getRole().isBlank()) {
            Role newRole = roleRepository.findByName(request.getRole())
                    .orElseThrow(() -> new RuntimeException("Role không tồn tại: " + request.getRole()));
            user.setRole(newRole);
        }
 
        return toDetailResponse(userRepository.save(user));
    }
 
    /**
     * Soft-delete staff: sets active = false.
     * WHY soft delete: preserve audit trail (who created orders, GRNs, etc.)
     * Hard delete would cascade-break foreign keys in orders, goods_receipts.
     */
    @Transactional
    public void softDeleteStaff(String userId, String currentUserId) {
        if (userId.equals(currentUserId)) {
            throw new AppException(ErrorCode.FORBIDDEN); // Cannot delete self
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
 
        String roleName = user.getRole() != null ? user.getRole().getName() : "";
        if ("SUPER_ADMIN".equals(roleName)) {
            throw new AppException(ErrorCode.FORBIDDEN); // Cannot delete SUPER_ADMIN
        }
 
        user.setActive(false);
        userRepository.save(user);
        log.info("[Staff Soft Deleted] id={} by admin={}", userId, currentUserId);
    }
 
    // ════════════════════════════════════════════════════════
    // STATUS MANAGEMENT (for both staff and customers)
    // ════════════════════════════════════════════════════════
 
    /**
     * Enable or disable any user account.
     * Used for: banning spammer customers, temporarily suspending staff.
     */
    @Transactional
    public UserDetailResponse updateUserStatus(String userId, UpdateUserStatusRequest request,
                                               String currentUserId) {
        if (userId.equals(currentUserId)) {
            throw new AppException(ErrorCode.FORBIDDEN); // Cannot disable self
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
 
        String roleName = user.getRole() != null ? user.getRole().getName() : "";
        if ("SUPER_ADMIN".equals(roleName)) {
            throw new AppException(ErrorCode.FORBIDDEN); // Cannot touch SUPER_ADMIN
        }
 
        user.setActive(request.getActive());
        userRepository.save(user);
 
        log.info("[User Status] id={} → active={} reason={}",
                userId, request.getActive(), request.getReason());
        return toDetailResponse(user);
    }
 
    // ════════════════════════════════════════════════════════
    // ROLE MANAGEMENT
    // ════════════════════════════════════════════════════════
 
    /**
     * Assign a new role to any user.
     * Restricted: cannot assign SUPER_ADMIN.
     */
    @Transactional
    public UserDetailResponse assignRole(String userId, String roleName) {
        if ("SUPER_ADMIN".equals(roleName)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role không tồn tại: " + roleName));
        user.setRole(role);
        return toDetailResponse(userRepository.save(user));
    }
 
    // ════════════════════════════════════════════════════════
    // PRIVATE HELPER
    // ════════════════════════════════════════════════════════
 
    private UserDetailResponse toDetailResponse(User user) {
        // Calculate order stats for customers (null for staff)
        Long totalOrders = null;
        BigDecimal totalSpent = null;
        String membershipTier = null;
 
        String roleName = user.getRole() != null ? user.getRole().getName() : "USER";
        if ("USER".equals(roleName) || "CUSTOMER".equals(roleName)) {
            try {
                List<com.example.clothingstore.entity.Order> orders =
                        orderRepository.findByUserId(user.getId());
                totalOrders = (long) orders.size();
                totalSpent = orders.stream()
                        .filter(o -> com.example.clothingstore.entity.Enum.OrderStatus.COMPLETED
                                .equals(o.getStatus()))
                        .map(com.example.clothingstore.entity.Order::getTotalAmount)
                        .filter(java.util.Objects::nonNull)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
 
                if (user.getCustomer() != null) {
                    membershipTier = user.getCustomer().getMembershipTier() != null
                            ? user.getCustomer().getMembershipTier().name() : null;
                }
            } catch (Exception e) {
                log.warn("Could not fetch order stats for user {}: {}", user.getId(), e.getMessage());
            }
        }
 
        return UserDetailResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .dob(user.getDob())
                .avatar(user.getAvatar())
                .active(user.isActive())
                .role(roleName)
                .provider(user.getProvider() != null ? user.getProvider().name() : null)
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .totalOrders(totalOrders)
                .totalSpent(totalSpent)
                .membershipTier(membershipTier)
                .build();
    }
}