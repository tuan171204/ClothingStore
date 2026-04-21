package com.example.clothingstore.service.impl;

import com.example.clothingstore.dtos.banner.request.BannerRequest;
import com.example.clothingstore.dtos.banner.response.BannerResponse;
import com.example.clothingstore.entity.Banner;
import com.example.clothingstore.exception.AppException;
import com.example.clothingstore.exception.ErrorCode;
import com.example.clothingstore.mapper.BannerMapper;
import com.example.clothingstore.repository.BannerRepository;
import com.example.clothingstore.service.cloudinary.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BannerServiceImpl {

    private final BannerRepository bannerRepository;
    private final CloudinaryService cloudinaryService;
    private final BannerMapper bannerMapper;

    private static final String CACHE_NAME = "banners";

    // Lấy banner cho khách hàng (Public)
    @Cacheable(value = CACHE_NAME, key = "#root.methodName")
    public BannerResponse[] getActiveBanners() {
        List<Banner> banners = bannerRepository.findByActiveTrueOrderByDisplayOrderAsc();

        // 👇 ĐÃ SỬA LỖI INCOMPATIBLE TYPES Ở ĐÂY BẰNG LAMBDA 👇
        return banners.stream()
                .map(banner -> bannerMapper.toResponse(banner))
                .toArray(BannerResponse[]::new);
    }

    // Admin tạo banner mới
    @Transactional
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public BannerResponse createBanner(BannerRequest request) {
        try {
            String imageUrl = cloudinaryService.uploadImage(request.file());

            Banner banner = Banner.builder()
                    .title(request.title())
                    .imageUrl(imageUrl)
                    .linkUrl(request.linkUrl())
                    .displayOrder(request.displayOrder())
                    .active(true)
                    .build();

            return bannerMapper.toResponse(bannerRepository.save(banner));
        } catch (IOException e) {
            throw new AppException(ErrorCode.BANNER_UPLOAD_ERROR);
        }
    }

    // Admin thay đổi trạng thái ẩn/hiện
    @Transactional
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public void toggleStatus(Long id) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Banner not found"));
        banner.setActive(!banner.isActive());
        bannerRepository.save(banner);
    }

    @Transactional
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public void deleteBanner(Long id) {
        if (!bannerRepository.existsById(id)) {
            throw new RuntimeException("Banner not found");
        }
        bannerRepository.deleteById(id);
    }
}