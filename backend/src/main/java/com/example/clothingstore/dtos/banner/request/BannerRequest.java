package com.example.clothingstore.dtos.banner.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.web.multipart.MultipartFile;

public record BannerRequest(
        @NotBlank(message = "Title cannot be blank")
        String title,

        @NotBlank(message = "Link URL is required")
        String linkUrl,

        @NotNull(message = "Display order is required")
        @Min(value = 1, message = "Display order must be at least 1")
        Integer displayOrder,

        @NotNull(message = "Banner image file is required")
        MultipartFile file
) {}