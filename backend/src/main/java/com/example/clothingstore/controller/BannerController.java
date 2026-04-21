package com.example.clothingstore.controller;

import com.example.clothingstore.dtos.banner.request.BannerRequest;
import com.example.clothingstore.dtos.banner.response.BannerResponse;
import com.example.clothingstore.service.impl.BannerServiceImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/banners")
@RequiredArgsConstructor
public class BannerController {

    private final BannerServiceImpl bannerService;

    // Public API cho Homepage
    @GetMapping
    public ResponseEntity<BannerResponse[]> getAllActive(){
        return ResponseEntity.ok(bannerService.getActiveBanners());
    }

    // Admin API
    @PostMapping(value = "/admin", consumes = "multipart/form-data")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'SUPER_ADMIN')")
    public ResponseEntity<BannerResponse> create(
            @ModelAttribute @Valid BannerRequest request
    ) throws IOException {
        return ResponseEntity.ok(bannerService.createBanner(request));
    }

    @PatchMapping("/admin/{id}/toggle")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'SUPER_ADMIN')")
    public ResponseEntity<Void> toggle(@PathVariable Long id) {
        bannerService.toggleStatus(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        bannerService.deleteBanner(id);
        return ResponseEntity.noContent().build();
    }
}