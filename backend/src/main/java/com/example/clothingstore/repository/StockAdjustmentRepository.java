package com.example.clothingstore.repository;

import com.example.clothingstore.entity.StockAdjustment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockAdjustmentRepository extends JpaRepository<StockAdjustment, Long> {

    /** Lịch sử điều chỉnh tồn kho của 1 SKU */
    List<StockAdjustment> findBySkuIdOrderByCreatedAtDesc(Long skuId);

    /** Lịch sử điều chỉnh do 1 user thực hiện */
    List<StockAdjustment> findByAdjustedByOrderByCreatedAtDesc(String userId);
}