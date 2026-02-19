package com.example.clothingstore.repository;

import com.example.clothingstore.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

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
}
