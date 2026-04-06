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

    /** All active sales overlapping [start, end] — used for conflict detection */
    @Query("""
            SELECT fs FROM FlashSale fs
            WHERE fs.isActive = true
              AND fs.startTime < :end
              AND fs.endTime   > :start
            """)
    List<FlashSale> findActiveInRange(
            @Param("start") LocalDateTime start,
            @Param("end")   LocalDateTime end);

    /** Admin list with optional name filter */
    Page<FlashSale> findByNameContainingIgnoreCase(String name, Pageable pageable);

    Page<FlashSale> findAll(Pageable pageable);
}