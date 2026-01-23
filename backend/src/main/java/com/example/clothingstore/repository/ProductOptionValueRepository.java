package com.example.clothingstore.repository;

import com.example.clothingstore.entity.ProductOptionValue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductOptionValueRepository extends JpaRepository<ProductOptionValue, Long> {
}
