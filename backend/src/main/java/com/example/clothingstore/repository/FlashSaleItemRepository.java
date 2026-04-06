package com.example.clothingstore.repository;

import com.example.clothingstore.entity.FlashSaleItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FlashSaleItemRepository extends JpaRepository<FlashSaleItem, Long> {
    List<FlashSaleItem> findByFlashSaleId(Long flashSaleId);
    boolean existsByFlashSaleIdAndSkuId(Long flashSaleId, Long skuId);
}