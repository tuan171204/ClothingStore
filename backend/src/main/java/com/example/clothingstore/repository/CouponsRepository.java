package com.example.clothingstore.repository;

import com.example.clothingstore.entity.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
@Repository
public interface CouponsRepository extends JpaRepository<Coupon, Long> {
    boolean existsByCode(String code);

    // (Tùy chọn) Tìm coupon theo mã code nếu cần lấy thông tin
    Optional<Coupon> findByCode(String code);
}