package com.example.clothingstore.repository.specification;

import com.example.clothingstore.entity.Category;
import com.example.clothingstore.entity.Product;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;
import java.math.BigDecimal;
import java.util.List;

public class ProductSpecification {

    // 1. Lọc theo Danh mục
    public static Specification<Product> hasCategory(Long categoryId) {
        if (categoryId == null) return null;

        return (root, query, cb) -> {
            Subquery<Long> categorySubquery = query.subquery(Long.class);
            Root<Category> catRoot = categorySubquery.from(Category.class);

            categorySubquery.select(catRoot.get("id"))
                    .where(cb.or(
                            cb.equal(catRoot.get("id"), categoryId),
                            cb.equal(catRoot.get("parent").get("id"), categoryId)
                    ));

            return root.get("category").get("id").in(categorySubquery);
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

    // 5. Lọc sản phẩm đang active.
    public static Specification<Product> isActive() {
        return (root, query, cb) -> cb.isTrue(root.get("isActive"));
    }

    /**
     * 6. Tổng hợp tất cả điều kiện lọc.
     * Luôn bao gồm isActive = true.
     *
     * @param productIdsFromSearch null = không có keyword (bỏ qua OpenSearch)
     */
    public static Specification<Product> buildFilter(
            List<Long> productIdsFromSearch,
            Long categoryId,
            Long brandId,
            BigDecimal minPrice,
            BigDecimal maxPrice
    ) {
        Specification<Product> spec = isActive();

        if (productIdsFromSearch != null) {
            spec = spec.and(hasIdIn(productIdsFromSearch));
        }
        if (categoryId != null) {
            spec = spec.and(hasCategory(categoryId));
        }
        if (brandId != null) {
            spec = spec.and(hasBrand(brandId));
        }
        if (minPrice != null || maxPrice != null) {
            spec = spec.and(priceBetween(minPrice, maxPrice));
        }

        return spec;
    }
}
