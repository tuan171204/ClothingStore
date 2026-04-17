package com.example.clothingstore.repository.specification;
 
import com.example.clothingstore.dtos.user.request.UserFilterRequest;
import com.example.clothingstore.entity.User;
import org.springframework.data.jpa.domain.Specification;
import java.time.LocalDateTime;
 
/**
 * Dynamic JPA Specification for User filtering.
 * Each predicate method is null-safe — returns null if param is absent,
 * which Specification.and() treats as "ignore this condition".
 */
public class UserSpecification {
 
    public static Specification<User> hasKeyword(String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.isBlank()) return null;
            String p = "%" + keyword.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("fullName")),   p),
                    cb.like(cb.lower(root.get("email")),      p),
                    cb.like(cb.lower(root.get("phoneNumber")), p),
                    cb.like(cb.lower(root.get("username")),   p)
            );
        };
    }
 
    public static Specification<User> hasRole(String roleName) {
        return (root, query, cb) -> {
            if (roleName == null || roleName.isBlank()) return null;
            return cb.equal(root.join("role").get("name"), roleName);
        };
    }
 
    public static Specification<User> isActive(Boolean active) {
        return (root, query, cb) -> {
            if (active == null) return null;
            return cb.equal(root.get("active"), active);
        };
    }
 
    public static Specification<User> hasProvider(String provider) {
        return (root, query, cb) -> {
            if (provider == null || provider.isBlank()) return null;
            return cb.equal(root.get("provider").as(String.class), provider);
        };
    }
 
    public static Specification<User> createdBetween(java.time.LocalDate from, java.time.LocalDate to) {
        return (root, query, cb) -> {
            if (from == null && to == null) return null;
            if (from != null && to != null)
                return cb.between(root.get("createdAt"), from, to);
            if (from != null)
                return cb.greaterThanOrEqualTo(root.get("createdAt"), from);
            return cb.lessThanOrEqualTo(root.get("createdAt"), to);
        };
    }
 
    public static Specification<User> buildSpec(UserFilterRequest filter) {
        return hasKeyword(filter.getKeyword())
                .and(hasRole(filter.getRole()))
                .and(isActive(filter.getActive()))
                .and(hasProvider(filter.getProvider()))
                .and(createdBetween(filter.getFromDate(), filter.getToDate()));
    }
}