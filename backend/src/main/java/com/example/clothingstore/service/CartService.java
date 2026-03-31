package com.example.clothingstore.service;

import com.example.clothingstore.dtos.cart.request.CartItemRequest;
import com.example.clothingstore.dtos.cart.response.CartResponse;

public interface CartService {
    CartResponse getCart(String userId);
    CartResponse addItem(String userId, CartItemRequest request);
    CartResponse updateItem(String userId, CartItemRequest request);
    void removeItem(String userId, Long skuId);
    void clearCart(String userId);
    CartResponse mergeGuestCart(String userId, String sessionId);
    CartResponse getGuestCart(String sessionId);
    CartResponse addItemToGuestCart(String sessionId, CartItemRequest request);
}