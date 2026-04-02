package com.example.clothingstore.repository;

import com.example.clothingstore.entity.Brand;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BrandRepository extends JpaRepository<Brand, Long> {
    boolean existsByName(String name);
    List<Brand> findByNameContainingIgnoreCase(String name);
    Page<Brand> findByNameContainingIgnoreCase(String name, Pageable pageable);
}