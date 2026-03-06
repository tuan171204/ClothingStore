package com.example.clothingstore.repository;

import com.example.clothingstore.entity.SkuValue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SkuValueRepository extends JpaRepository<SkuValue, Long> {
    List<SkuValue> findByOptionValueId(Long optionValueId);
}
