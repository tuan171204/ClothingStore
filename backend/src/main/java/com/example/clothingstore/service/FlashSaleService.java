package com.example.clothingstore.service;

import com.example.clothingstore.dtos.PagedResponse;
import com.example.clothingstore.dtos.flashsale.request.FlashSaleRequest;
import com.example.clothingstore.dtos.flashsale.response.FlashSaleResponse;

public interface FlashSaleService {
    PagedResponse<FlashSaleResponse> getAll(String keyword, int page, int size);
    FlashSaleResponse getById(Long id);
    FlashSaleResponse create(FlashSaleRequest request);
    FlashSaleResponse update(Long id, FlashSaleRequest request);
    void delete(Long id);
}