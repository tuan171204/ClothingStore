// ======== GoodsReceiptItemRepository.java ========
package com.example.clothingstore.repository;

import com.example.clothingstore.entity.GoodsReceiptItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GoodsReceiptItemRepository extends JpaRepository<GoodsReceiptItem, Long> {
    List<GoodsReceiptItem> findByGoodsReceiptId(Long grnId);
}