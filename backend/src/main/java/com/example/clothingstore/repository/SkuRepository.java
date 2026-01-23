package com.example.clothingstore.repository;

import com.example.clothingstore.entity.Sku;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SkuRepository extends JpaRepository<Sku, Long> {
    // 1. Tìm SKU theo mã vạch (Dùng khi bắn súng tít mã vạch hoặc nhập mã)
    Optional<Sku> findByCode(String code);

    // 2. Lấy tất cả biến thể của 1 sản phẩm cha
    List<Sku> findByProductId(Long productId);

    // 3. (Query quan trọng) Tìm SKU dựa trên list Option Value ID
    // Ví dụ: Tìm SKU của áo (ID 1) có Màu Đỏ (301) và Size M (308)
    // Đây là câu query khó nhất, tạm thời ta sẽ xử lý logic này ở Service Java
    // bằng cách lấy hết SKU của Product đó ra rồi lọc vòng lặp cho dễ hiểu trước.

}
