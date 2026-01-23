package com.example.clothingstore.repository;

import com.example.clothingstore.entity.SkuValue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SkuValueRepository extends JpaRepository<SkuValue, Long> {
}
