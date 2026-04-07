package com.example.clothingstore.controller;

import com.example.clothingstore.dtos.ApiResponse;
import com.example.clothingstore.dtos.order.request.CheckoutRequest;
import com.example.clothingstore.dtos.order.response.CheckoutResponse;
import com.example.clothingstore.service.impl.CheckoutService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("${api.prefix}/orders")
@RequiredArgsConstructor
public class CheckoutController {

    private final CheckoutService checkoutService;

    /**
     * POST /api/v1/orders/checkout
     *
     * Response HTTP Status:
     *   200 SUCCESS          → tạo order thành công
     *   409 OUT_OF_STOCK     → hết hàng hoàn toàn
     *   422 PARTIAL_AVAILABLE→ còn hàng nhưng ít hơn yêu cầu
     */
    @PostMapping("/checkout")
    public ResponseEntity<ApiResponse<CheckoutResponse>> checkout(
            @Valid @RequestBody CheckoutRequest request
    ) {
        CheckoutResponse result = checkoutService.checkout(request);

        HttpStatus status = switch (result.getStatus()) {
            case SUCCESS           -> HttpStatus.OK;
            case OUT_OF_STOCK      -> HttpStatus.CONFLICT;           // 409
            case PARTIAL_AVAILABLE -> HttpStatus.UNPROCESSABLE_ENTITY; // 422
        };

        return ResponseEntity.status(status)
                .body(ApiResponse.<CheckoutResponse>builder()
                        .code(status.value())
                        .result(result)
                        .build());
    }

            @PostMapping("/checkout/preview")
            public ResponseEntity<ApiResponse<CheckoutResponse>> previewCheckout(
                @RequestBody CheckoutRequest request
            ) {
            CheckoutResponse result = checkoutService.previewCheckout(request);
            return ResponseEntity.ok(ApiResponse.<CheckoutResponse>builder()
                .code(HttpStatus.OK.value())
                .result(result)
                .build());
            }
}