package com.example.clothingstore.repository;

import com.example.clothingstore.entity.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByParentIsNull();
    boolean existsByName(String name);
    List<Category> findByNameContainingIgnoreCase(String name);
    Page<Category> findByNameContainingIgnoreCase(String name, Pageable pageable);
    List<Category> findByNameContainingIgnoreCaseAndParentIsNull(String name);
    Page<Category> findByNameContainingIgnoreCaseAndParentIsNull(String name, Pageable pageable);
    Page<Category> findByParentIsNull(Pageable pageable);
    Page<Category> findByParentIsNotNull(Pageable pageable);
}