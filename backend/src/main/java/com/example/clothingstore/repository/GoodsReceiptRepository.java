package com.example.clothingstore.repository;

import com.example.clothingstore.entity.GoodsReceipt;
import com.example.clothingstore.entity.Enum.GrnStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GoodsReceiptRepository extends JpaRepository<GoodsReceipt, Long> {

    List<GoodsReceipt> findAllByOrderByCreatedAtDesc();

    List<GoodsReceipt> findByStatus(GrnStatus status);

    /** Load GRN kèm items để tránh lỗi Lazy Loading */
    @Query("SELECT g FROM GoodsReceipt g LEFT JOIN FETCH g.items i LEFT JOIN FETCH i.sku WHERE g.id = :id")
    Optional<GoodsReceipt> findByIdWithItems(@Param("id") Long id);
}
