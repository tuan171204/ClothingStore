package com.example.clothingstore.repository;

import com.example.clothingstore.entity.StockMovement;
import com.example.clothingstore.entity.Enum.StockMovementType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {

    List<StockMovement> findBySkuIdOrderByCreatedAtDesc(Long skuId);

    /** Lọc theo loại biến động */
    List<StockMovement> findByMovementTypeOrderByCreatedAtDesc(StockMovementType movementType);

    /** Lấy tất cả biến động của một tham chiếu cụ thể (VD: tất cả movements của GRN #5) */
    List<StockMovement> findByReferenceId(String referenceId);
}