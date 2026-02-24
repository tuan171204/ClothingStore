package com.example.clothingstore.repository.auth;

import com.example.clothingstore.entity.auth.InvalidatedToken;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvalidatedTokenRepository extends JpaRepository<InvalidatedToken, String> {
}
