package com.example.clothingstore.repository;

import com.example.clothingstore.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    // 1. Lấy danh sách sản phẩm theo Category (VD: Lấy tất cả Áo Thun)
    List<Product> findByCategoryId(Long categoryId);

    // 2. Lấy danh sách sản phẩm theo Thương hiệu
    List<Product> findByBrandId(Long brandId);

    // 3. Tìm kiếm sản phẩm theo tên (Dùng cho thanh Search)
    // Containing tương đương với LIKE %keyword% trong SQL
    List<Product> findByNameContainingIgnoreCase(String keyword);

    // 4. Lấy sản phẩm đang hoạt động (IsActive = true)
    List<Product> findByIsActiveTrue();

    // ... Các query nâng cao
    @Query("""
    SELECT DISTINCT p FROM Product p
    LEFT JOIN FETCH p.skus s
    LEFT JOIN FETCH s.values sv
    LEFT JOIN FETCH sv.optionValue ov
    LEFT JOIN FETCH ov.productOption po
    WHERE p.id = :productId
      AND s.isActive = true
      AND sv.isActive = true
    """)
    Optional<Product> findByIdWithActiveSkusAndValues(@Param("productId") Long productId);
}
