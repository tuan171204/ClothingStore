package com.example.clothingstore.service.impl;

import com.example.clothingstore.dtos.PagedResponse;
import com.example.clothingstore.dtos.address.response.AddressResponse;
import com.example.clothingstore.dtos.user.request.*;
import com.example.clothingstore.dtos.user.response.*;
import com.example.clothingstore.entity.Role;
import com.example.clothingstore.entity.User;
import com.example.clothingstore.exception.AppException;
import com.example.clothingstore.exception.ErrorCode;
import com.example.clothingstore.mapper.AddressMapper;
import com.example.clothingstore.mapper.UserMapper;
import com.example.clothingstore.repository.AddressRepository;
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

/**
 * UserManagementService — tầng Business Logic duy nhất cho quản lý User.
 *
 * Nhiệm vụ:
 *   - Thực thi toàn bộ business rules (validate, kiểm tra quyền, tính toán)
 *   - Điều phối các Repository (UserRepository, AddressRepository, OrderRepository...)
 *   - Dùng Mapper để chuyển đổi Entity <-> DTO
 *   - KHÔNG biết gì về HTTP, SecurityContext, hay request/response format
 *
 * KHÔNG: xử lý HTTP status, đọc SecurityContext trực tiếp.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserManagementService {

    private final UserRepository    userRepository;
    private final RoleRepository    roleRepository;
    private final OrderRepository   orderRepository;
    private final AddressRepository addressRepository;
    private final AddressMapper     addressMapper;
    private final UserMapper        userMapper;
    private final PasswordEncoder   passwordEncoder;

    // ════════════════════════════════════════════════════════
    // AUTH HELPER — được Controller gọi để tách SecurityContext khỏi Service
    // ════════════════════════════════════════════════════════

    /**
     * Tra cứu userId từ username (lấy từ JWT).
     * Controller truyền username xuống, Service không cần biết SecurityContext.
     */
    public String resolveCurrentUserId(String username) {
        return userRepository.findByUsername(username)
                .map(User::getId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    // ════════════════════════════════════════════════════════
    // LIST & SEARCH
    // ════════════════════════════════════════════════════════

    /**
     * Danh sách customer có filter + phân trang.
     * Dùng JPA Specification để lọc động theo keyword/active/provider/date.
     */
    public PagedResponse<UserDetailResponse> getUsers(UserFilterRequest filter) {
        var spec = UserSpecification.buildSpec(filter);
        var pageable = PageRequest.of(
                filter.getPage(), filter.getSize(),
                Sort.by("createdAt").descending()
        );
        Page<User> page = userRepository.findAll(spec, pageable);

        return buildPagedResponse(page);
    }

    /**
     * Danh sách staff (STAFF + ADMIN) với filter + phân trang.
     *
     * Sử dụng Specification riêng thay vì filter client-side.
     * Khi filter.role = null → lấy cả STAFF lẫn ADMIN qua UserSpecification.
     */
    public PagedResponse<UserDetailResponse> getStaff(UserFilterRequest filter) {
        // Nếu không có role cụ thể, dùng role = "STAFF_GROUP" để Spec biết lấy cả hai
        // Hoặc đơn giản: truyền danh sách roles vào filter, Spec xử lý IN clause
        var spec = UserSpecification.buildStaffSpec(filter);
        var pageable = PageRequest.of(
                filter.getPage(), filter.getSize(),
                Sort.by("createdAt").descending()
        );
        Page<User> page = userRepository.findAll(spec, pageable);

        return buildPagedResponse(page);
    }

    /**
     * Chi tiết 1 user bất kỳ (kèm order stats nếu là customer).
     */
    public UserDetailResponse getUserDetail(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return toDetailResponse(user);
    }

    // ════════════════════════════════════════════════════════
    // ADDRESS
    // ════════════════════════════════════════════════════════

    /**
     * Lấy toàn bộ sổ địa chỉ của 1 user theo userId.
     * Logic nằm ở Service — Controller chỉ gọi và trả về kết quả.
     */
    public List<AddressResponse> getUserAddresses(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        return addressRepository.findByUser(user)
                .stream()
                .map(addressMapper::toAddressResponse)
                .collect(Collectors.toList());
    }

    // ════════════════════════════════════════════════════════
    // STAFF MANAGEMENT
    // ════════════════════════════════════════════════════════

    /**
     * Admin tạo tài khoản nhân viên mới.
     *
     * Business rules:
     * - Không được gán role SUPER_ADMIN
     * - Username và email phải unique
     * - Password được hash bằng BCrypt
     */
    @Transactional
    public UserDetailResponse createStaff(CreateStaffRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new AppException(ErrorCode.USER_ALREADY_EXISTS);
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.USER_ALREADY_EXISTS);
        }
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
     * Admin cập nhật thông tin nhân viên.
     *
     * Business rules:
     * - Không được gán role SUPER_ADMIN
     * - Admin không được tự thay role của mình
     */
    @Transactional
    public UserDetailResponse updateStaff(String userId, UpdateStaffRequest request, String currentUserId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if ("SUPER_ADMIN".equals(request.getRole())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
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
     * Soft-delete nhân viên (active = false).
     *
     * WHY soft delete: giữ nguyên audit trail (ai tạo đơn, GRN...).
     * Hard delete sẽ phá vỡ foreign key trong orders, goods_receipts.
     */
    @Transactional
    public void softDeleteStaff(String userId, String currentUserId) {
        if (userId.equals(currentUserId)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if ("SUPER_ADMIN".equals(user.getRole() != null ? user.getRole().getName() : "")) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        user.setActive(false);
        userRepository.save(user);
        log.info("[Staff Soft Deleted] id={} by admin={}", userId, currentUserId);
    }

    // ════════════════════════════════════════════════════════
    // STATUS & ROLE MANAGEMENT
    // ════════════════════════════════════════════════════════

    /**
     * Bật / tắt tài khoản bất kỳ (khách hàng hoặc nhân viên).
     * Dùng cho: ban spam customer, tạm ngưng nhân viên nghỉ phép.
     */
    @Transactional
    public UserDetailResponse updateUserStatus(String userId, UpdateUserStatusRequest request,
                                               String currentUserId) {
        if (userId.equals(currentUserId)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if ("SUPER_ADMIN".equals(user.getRole() != null ? user.getRole().getName() : "")) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        user.setActive(request.getActive());
        userRepository.save(user);

        log.info("[User Status] id={} → active={} reason={}",
                userId, request.getActive(), request.getReason());
        return toDetailResponse(user);
    }

    /**
     * Gán role mới cho user.
     * Business rule: không được gán SUPER_ADMIN.
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
    // PRIVATE HELPERS
    // ════════════════════════════════════════════════════════

    /**
     * Chuyển User entity → UserDetailResponse với order stats (chỉ cho customer).
     */
    private UserDetailResponse toDetailResponse(User user) {
        Long totalOrders = null;
        BigDecimal totalSpent = null;
        String membershipTier = null;

        String roleName = user.getRole() != null ? user.getRole().getName() : "USER";
        boolean isCustomer = "USER".equals(roleName) || "CUSTOMER".equals(roleName);

        if (isCustomer) {
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

                if (user.getCustomer() != null && user.getCustomer().getMembershipTier() != null) {
                    membershipTier = user.getCustomer().getMembershipTier().name();
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

    /**
     * Chuyển Page<User> → PagedResponse<UserDetailResponse>.
     */
    private PagedResponse<UserDetailResponse> buildPagedResponse(Page<User> page) {
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
}