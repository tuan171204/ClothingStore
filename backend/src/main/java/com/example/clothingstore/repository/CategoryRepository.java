package com.example.clothingstore.repository;

import com.example.clothingstore.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    // Lấy các danh mục gốc (Cha là null) -> Để hiển thị Level 1 của Menu
    List<Category> findByParentIsNull();
}
