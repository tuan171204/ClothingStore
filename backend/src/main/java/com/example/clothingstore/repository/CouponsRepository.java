package com.example.clothingstore.repository;

import com.example.clothingstore.entity.Coupon;
import com.example.clothingstore.entity.Enum.ApplyType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CouponsRepository extends JpaRepository<Coupon, Long> {
    boolean existsByCode(String code);
    Optional<Coupon> findByCode(String code);

    @Query("""
        SELECT c FROM Coupon c
        WHERE (:applyType IS NULL OR c.applyType = :applyType)
          AND (:isActive  IS NULL OR c.isActive  = :isActive)
          AND (:start     IS NULL OR c.startDate >= :start)
          AND (:end       IS NULL OR c.endDate   <= :end)
        ORDER BY c.id DESC
        """)
    List<Coupon> findWithFilters(
            @Param("applyType") ApplyType applyType,
            @Param("isActive")  Boolean  isActive,
            @Param("start")     LocalDateTime start,
            @Param("end")       LocalDateTime end);

    @Query("""
        SELECT c FROM Coupon c
        WHERE (:applyType IS NULL OR c.applyType = :applyType)
          AND (:isActive  IS NULL OR c.isActive  = :isActive)
          AND (:start     IS NULL OR c.startDate >= :start)
          AND (:end       IS NULL OR c.endDate   <= :end)
        ORDER BY c.id DESC
        """)
    Page<Coupon> findWithFiltersPaged(
            @Param("applyType") ApplyType applyType,
            @Param("isActive")  Boolean  isActive,
            @Param("start")     LocalDateTime start,
            @Param("end")       LocalDateTime end,
            Pageable pageable);
}