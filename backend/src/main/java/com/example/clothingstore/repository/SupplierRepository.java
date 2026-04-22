package com.example.clothingstore.repository;

import com.example.clothingstore.entity.Supplier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long> {

    boolean existsByTaxCode(String taxCode);

    boolean existsByTaxCodeAndIdNot(String taxCode, Long id);

    /** Tìm kiếm theo tên hoặc email hoặc phone (case-insensitive) */
    @Query("""
        SELECT s FROM Supplier s
        WHERE s.isActive = true
          AND (
            :keyword IS NULL OR :keyword = ''
            OR LOWER(s.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(s.email) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR s.phone LIKE CONCAT('%', :keyword, '%')
          )
        ORDER BY s.name ASC
        """)
    Page<Supplier> findActiveByKeyword(@Param("keyword") String keyword, Pageable pageable);

    /** Tìm kiếm bao gồm cả nhà cung cấp đã ẩn (dành cho Admin) */
    @Query("""
        SELECT s FROM Supplier s
        WHERE (
            :keyword IS NULL OR :keyword = ''
            OR LOWER(s.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(s.email) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR s.phone LIKE CONCAT('%', :keyword, '%')
        )
        ORDER BY s.isActive DESC, s.name ASC
        """)
    Page<Supplier> findAllByKeyword(@Param("keyword") String keyword, Pageable pageable);

    /** Dropdown: chỉ lấy nhà cung cấp đang hoạt động */
    List<Supplier> findByIsActiveTrueOrderByNameAsc();
}