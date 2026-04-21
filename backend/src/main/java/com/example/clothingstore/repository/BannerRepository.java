package com.example.clothingstore.repository;

import com.example.clothingstore.entity.Banner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BannerRepository extends JpaRepository<Banner, Long> {
    // Cho Customer: Chỉ lấy cái đang hoạt động và sắp xếp theo thứ tự hiển thị
    List<Banner> findByActiveTrueOrderByDisplayOrderAsc();

    // Cho Admin: Lấy tất cả để quản lý
    List<Banner> findAllByOrderByDisplayOrderAsc();
}