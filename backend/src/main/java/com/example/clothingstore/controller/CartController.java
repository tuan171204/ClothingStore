package com.example.clothingstore.controller;

import com.example.clothingstore.dtos.ApiResponse;
import com.example.clothingstore.dtos.cart.request.CartItemRequest;
import com.example.clothingstore.dtos.cart.response.CartResponse;
import com.example.clothingstore.entity.User;
import com.example.clothingstore.repository.UserRepository;
import com.example.clothingstore.service.CartService;
import com.example.clothingstore.service.impl.CartServiceImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("${api.prefix}/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;
    private final UserRepository userRepository;

    @GetMapping
    public ApiResponse<CartResponse> getCart() {
        return ApiResponse.<CartResponse>builder()
                .result(cartService.getCart(resolveUserId()))
                .build();
    }

    @PostMapping("/items")
    public ApiResponse<CartResponse> addItem(@Valid @RequestBody CartItemRequest request) {
        return ApiResponse.<CartResponse>builder()
                .result(cartService.addItem(resolveUserId(), request))
                .build();
    }

    @PutMapping("/items")
    public ApiResponse<CartResponse> updateItem(@Valid @RequestBody CartItemRequest request) {
        return ApiResponse.<CartResponse>builder()
                .result(cartService.updateItem(resolveUserId(), request))
                .build();
    }

    @DeleteMapping("/items/{skuId}")
    public ApiResponse<Void> removeItem(@PathVariable Long skuId) {
        cartService.removeItem(resolveUserId(), skuId);
        return ApiResponse.<Void>builder().build();
    }

    @DeleteMapping
    public ApiResponse<Void> clearCart() {
        cartService.clearCart(resolveUserId());
        return ApiResponse.<Void>builder().build();
    }

    @GetMapping("/validate")
    public ApiResponse<CartResponse> validateCart() {
        return ApiResponse.<CartResponse>builder()
                .result(((CartServiceImpl) cartService).validateAndSyncCart(resolveUserId()))
                .build();
    }

    // --- Guest Cart ---
    @GetMapping("/guest/{sessionId}")
    public ApiResponse<CartResponse> getGuestCart(@PathVariable String sessionId) {
        return ApiResponse.<CartResponse>builder()
                .result(cartService.getGuestCart(sessionId))
                .build();
    }

    @PostMapping("/guest/{sessionId}/items")
    public ApiResponse<CartResponse> addToGuestCart(
            @PathVariable String sessionId,
            @Valid @RequestBody CartItemRequest request
    ) {
        return ApiResponse.<CartResponse>builder()
                .result(cartService.addItemToGuestCart(sessionId, request))
                .build();
    }

    // --- Merge khi login ---
    @PostMapping("/merge")
    public ApiResponse<CartResponse> mergeCart(@RequestParam String sessionId) {
        return ApiResponse.<CartResponse>builder()
                .result(cartService.mergeGuestCart(resolveUserId(), sessionId))
                .build();
    }

    private String resolveUserId() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .map(User::getId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}