package com.example.clothingstore.repository;

import com.example.clothingstore.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    Optional<Inventory> findBySkuId(Long skuId);

    @Query("SELECT i FROM Inventory i WHERE i.lowStockThreshold > 0 AND i.availableQuantity < i.lowStockThreshold")
    List<Inventory> findLowStockItems();

    boolean existsBySkuId(Long skuId);
}