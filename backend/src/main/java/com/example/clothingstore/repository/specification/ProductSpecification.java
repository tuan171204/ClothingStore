package com.example.clothingstore.repository.specification;

import com.example.clothingstore.entity.Product;
import org.springframework.data.jpa.domain.Specification;
import java.math.BigDecimal;
import java.util.List;

public class ProductSpecification {

    // 1. Lọc theo Danh mục
    public static Specification<Product> hasCategory(Long categoryId) {
        return (root, query, criteriaBuilder) -> {
            if (categoryId == null) return null; // Nếu Frontend không truyền lên, bỏ qua điều kiện này
            return criteriaBuilder.equal(root.get("category").get("id"), categoryId);
        };
    }

    // 2. Lọc theo Thương hiệu
    public static Specification<Product> hasBrand(Long brandId) {
        return (root, query, criteriaBuilder) -> {
            if (brandId == null) return null; // Nếu Frontend không truyền lên, bỏ qua điều kiện này
            return criteriaBuilder.equal(root.get("brand").get("id"), brandId);
        };
    }

    // 3. Lọc theo Khoảng giá (Giá gốc)
    public static Specification<Product> priceBetween(BigDecimal minPrice, BigDecimal maxPrice) {
        return (root, query, criteriaBuilder) -> {
            if (minPrice == null && maxPrice == null) return null;
            if (minPrice != null && maxPrice != null) {
                return criteriaBuilder.between(root.get("basePrice"), minPrice, maxPrice);
            }
            if (minPrice != null) {
                return criteriaBuilder.greaterThanOrEqualTo(root.get("basePrice"), minPrice);
            }
            // Trường hợp chỉ có maxPrice
            return criteriaBuilder.lessThanOrEqualTo(root.get("basePrice"), maxPrice);
        };
    }

    // 4. Lọc theo danh sách ID (Dùng kết hợp với kết quả từ Elasticsearch)
    public static Specification<Product> hasIdIn(List<Long> ids) {
        return (root, query, criteriaBuilder) -> {
            if (ids == null || ids.isEmpty()) {
                // Nếu danh sách ID rỗng, tức là không tìm thấy SP nào, ta ép điều kiện thành FALSE (1=0)
                return criteriaBuilder.disjunction();
            }
            return root.get("id").in(ids);
        };
    }
}
