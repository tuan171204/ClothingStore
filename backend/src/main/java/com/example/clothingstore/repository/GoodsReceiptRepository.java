package com.example.clothingstore.repository;

import com.example.clothingstore.entity.GoodsReceipt;
import com.example.clothingstore.entity.Enum.GrnStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface GoodsReceiptRepository extends JpaRepository<GoodsReceipt, Long>,
        JpaSpecificationExecutor<GoodsReceipt> {

    List<GoodsReceipt> findAllByOrderByCreatedAtDesc();

    List<GoodsReceipt> findByStatus(GrnStatus status);

    @Query("SELECT g FROM GoodsReceipt g LEFT JOIN FETCH g.items i LEFT JOIN FETCH i.sku WHERE g.id = :id")
    Optional<GoodsReceipt> findByIdWithItems(@Param("id") Long id);

    @Query("""
        SELECT g FROM GoodsReceipt g
        WHERE (:status IS NULL OR g.status = :status)
          AND (:from IS NULL OR g.createdAt >= :from)
          AND (:to   IS NULL OR g.createdAt <= :to)
        ORDER BY g.createdAt DESC
        """)
    Page<GoodsReceipt> findAllWithFilters(
            @Param("status") GrnStatus status,
            @Param("from")   LocalDateTime from,
            @Param("to")     LocalDateTime to,
            Pageable pageable);
}