package com.example.clothingstore.repository;

import com.example.clothingstore.entity.Inventory;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    Optional<Inventory> findBySkuId(Long skuId);

    @Query("SELECT i FROM Inventory i WHERE i.availableQuantity <= 0 OR (i.lowStockThreshold > 0 AND i.availableQuantity <= i.lowStockThreshold)")
    List<Inventory> findLowStockItems();

    boolean existsBySkuId(Long skuId);

    // PESSIMISTIC_WRITE = SELECT ... FOR UPDATE
    // Dùng cho flash sale hoặc khi optimistic lock retry rate > 30%
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Inventory i WHERE i.sku.id = :skuId")
    Optional<Inventory> findBySkuIdWithLock(@Param("skuId") Long skuId);

    // Batch load cho checkout validation (tránh N+1)
    @Query("SELECT i FROM Inventory i WHERE i.sku.id IN :skuIds")
    List<Inventory> findBySkuIdIn(@Param("skuIds") List<Long> skuIds);

    // Batch load với lock (dùng cho multi-item checkout với pessimistic)
    // ORDER BY sku.id để tránh deadlock khi nhiều transaction lock cùng rows
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Inventory i WHERE i.sku.id IN :skuIds ORDER BY i.sku.id ASC")
    List<Inventory> findBySkuIdInWithLock(@Param("skuIds") List<Long> skuIds);
}