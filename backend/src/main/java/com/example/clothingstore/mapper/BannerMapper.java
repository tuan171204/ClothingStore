package com.example.clothingstore.mapper;

import com.example.clothingstore.dtos.banner.response.BannerResponse;
import com.example.clothingstore.entity.Banner;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface BannerMapper {
    BannerResponse toResponse(Banner banner);
}