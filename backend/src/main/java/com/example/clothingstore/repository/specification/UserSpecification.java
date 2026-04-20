package com.example.clothingstore.repository.specification;

import com.example.clothingstore.dtos.user.request.UserFilterRequest;
import com.example.clothingstore.entity.User;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

/**
 * JPA Specification cho User entity.
 *
 * Tách riêng 2 spec:
 *   - buildSpec()      → dành cho Customer (filter theo 1 role cụ thể)
 *   - buildStaffSpec() → dành cho Staff (STAFF + ADMIN, dùng IN clause)
 */
public class UserSpecification {

    private UserSpecification() {}

    /**
     * Spec tổng quát — dùng cho Customer list.
     * Filter: keyword (name/email/phone), role (1 role), active, provider, date range.
     */
    public static Specification<User> buildSpec(UserFilterRequest filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // keyword: tìm theo tên, email, hoặc SĐT
            if (filter.getKeyword() != null && !filter.getKeyword().isBlank()) {
                String kw = "%" + filter.getKeyword().trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("fullName")), kw),
                        cb.like(cb.lower(root.get("email")), kw),
                        cb.like(root.get("phoneNumber"), "%" + filter.getKeyword().trim() + "%")
                ));
            }

            // role: lọc theo tên role cụ thể (USER, CUSTOMER, STAFF, ADMIN...)
            if (filter.getRole() != null && !filter.getRole().isBlank()) {
                predicates.add(cb.equal(root.get("role").get("name"), filter.getRole()));
            }

            // active status
            if (filter.getActive() != null) {
                predicates.add(cb.equal(root.get("active"), filter.getActive()));
            }

            // auth provider (LOCAL / GOOGLE)
            if (filter.getProvider() != null && !filter.getProvider().isBlank()) {
                predicates.add(cb.equal(
                        root.get("provider").as(String.class),
                        filter.getProvider().toUpperCase()
                ));
            }

            // ngày đăng ký từ
            if (filter.getFromDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), filter.getFromDate()));
            }

            // ngày đăng ký đến
            if (filter.getToDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), filter.getToDate()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    /**
     * Spec cho Staff list — luôn lọc role IN (STAFF, ADMIN).
     * Nếu filter.role có giá trị cụ thể (VD: "STAFF"), thêm điều kiện bằng exact match.
     *
     * Không filter client-side; toàn bộ logic nằm ở DB query.
     */
    public static Specification<User> buildStaffSpec(UserFilterRequest filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Luôn giới hạn trong staff roles
            if (filter.getRole() != null && !filter.getRole().isBlank()) {
                // Role cụ thể được chỉ định (VD: chỉ lấy STAFF)
                predicates.add(cb.equal(root.get("role").get("name"), filter.getRole()));
            } else {
                // Mặc định: lấy cả STAFF lẫn ADMIN
                predicates.add(root.get("role").get("name").in(List.of("STAFF", "ADMIN")));
            }

            // keyword
            if (filter.getKeyword() != null && !filter.getKeyword().isBlank()) {
                String kw = "%" + filter.getKeyword().trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("fullName")), kw),
                        cb.like(cb.lower(root.get("email")), kw),
                        cb.like(root.get("phoneNumber"), "%" + filter.getKeyword().trim() + "%")
                ));
            }

            // active status
            if (filter.getActive() != null) {
                predicates.add(cb.equal(root.get("active"), filter.getActive()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}