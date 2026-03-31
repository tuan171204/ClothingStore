package com.example.clothingstore.repository.specification;

import com.example.clothingstore.dtos.order.request.OrderFilterRequest;
import com.example.clothingstore.entity.Order;
import com.example.clothingstore.entity.Enum.OrderStatus;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;

public class OrderSpecification {

    /**
     * Tìm theo keyword: kiểm tra mã đơn (id) hoặc tên khách hàng, SĐT, mã vận đơn
     */
    public static Specification<Order> hasKeyword(String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.trim().isEmpty()) return null;
            String kw = keyword.trim();
            String pattern = "%" + kw.toLowerCase() + "%";

            // Khởi tạo các điều kiện tìm kiếm trên cột chuỗi
            var fullNamePredicate = cb.like(cb.lower(root.get("fullName")), pattern);
            var phonePredicate = cb.like(cb.lower(root.get("phoneNumber")), pattern);
            var trackingPredicate = cb.like(cb.lower(root.get("trackingCode")), pattern);

            try {
                // Thử parse keyword thành số Long.
                // Nếu parse thành công (user tìm theo ID), gộp thêm điều kiện cb.equal
                Long id = Long.valueOf(kw);
                return cb.or(fullNamePredicate, phonePredicate, trackingPredicate, cb.equal(root.get("id"), id));
            } catch (NumberFormatException e) {
                // Nếu keyword chứa chữ (VD: mã vận đơn "LTAPGC"), chỉ tìm kiếm trên các trường chuỗi
                return cb.or(fullNamePredicate, phonePredicate, trackingPredicate);
            }
        };
    }

    /**
     * Lọc theo trạng thái đơn hàng
     */
    public static Specification<Order> hasStatus(OrderStatus status) {
        return (root, query, cb) -> {
            if (status == null) return null;
            return cb.equal(root.get("status"), status);
        };
    }

    /**
     * Lọc theo phương thức thanh toán
     */
    public static Specification<Order> hasPaymentMethod(String paymentMethod) {
        return (root, query, cb) -> {
            if (paymentMethod == null || paymentMethod.trim().isEmpty()) return null;
            return cb.equal(root.get("paymentMethod"), paymentMethod);
        };
    }

    /**
     * Lọc từ ngày
     */
    public static Specification<Order> fromDate(LocalDateTime fromDate) {
        return (root, query, cb) -> {
            if (fromDate == null) return null;
            return cb.greaterThanOrEqualTo(root.get("createdAt"), fromDate);
        };
    }

    /**
     * Lọc đến ngày
     */
    public static Specification<Order> toDate(LocalDateTime toDate) {
        return (root, query, cb) -> {
            if (toDate == null) return null;
            return cb.lessThanOrEqualTo(root.get("createdAt"), toDate);
        };
    }

    /**
     * Build Specification từ filter request
     */
    public static Specification<Order> buildSpec(OrderFilterRequest filter) {
        return hasKeyword(filter.getKeyword())
                .and(hasStatus(filter.getStatus()))
                .and(hasPaymentMethod(filter.getPaymentMethod()))
                .and(fromDate(filter.getFromDate()))
                .and(toDate(filter.getToDate()));
    }
}