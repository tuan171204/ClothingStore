package com.example.clothingstore.repository;

import com.example.clothingstore.entity.FlashSale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FlashSaleRepository extends JpaRepository<FlashSale, Long> {

    @Query("""
            SELECT fs FROM FlashSale fs
            WHERE fs.isActive = true
              AND fs.startTime < :end
              AND fs.endTime   > :start
            """)
    List<FlashSale> findActiveInRange(
            @Param("start") LocalDateTime start,
            @Param("end")   LocalDateTime end);

    Page<FlashSale> findByNameContainingIgnoreCase(String name, Pageable pageable);

    Page<FlashSale> findAll(Pageable pageable);

    @Query("""
            SELECT DISTINCT fs FROM FlashSale fs
            LEFT JOIN FETCH fs.items
            WHERE fs.isActive = true
              AND fs.endTime > CURRENT_TIMESTAMP
            """)
    List<FlashSale> findCurrentlyActiveSales();

    /**
     * FIX: Accepts :now parameter so the caller can pass a "graced" time
     * (e.g. LocalDateTime.now().plusSeconds(30)) to include sales that
     * started very recently (within the grace window).
     *
     * The condition fs.startTime <= :now means: the sale has already started
     * (or will start within the grace period from the caller's perspective).
     */
    @Query("""
            SELECT DISTINCT fs FROM FlashSale fs
            LEFT JOIN FETCH fs.items
            WHERE fs.isActive = true
              AND fs.startTime <= :now
              AND fs.endTime > :now
            ORDER BY fs.startTime ASC
            """)
    List<FlashSale> findCurrentActiveSales(@Param("now") LocalDateTime now);
}