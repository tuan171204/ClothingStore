package com.example.clothingstore.controller;

import com.example.clothingstore.dtos.PagedResponse;
import com.example.clothingstore.dtos.flashsale.request.FlashSaleRequest;
import com.example.clothingstore.dtos.flashsale.response.FlashSaleResponse;
import com.example.clothingstore.service.FlashSaleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

@RestController
@RequestMapping("${api.prefix}/flash-sales")
@RequiredArgsConstructor
public class FlashSaleController {

    private final FlashSaleService flashSaleService;

    /**
     * GET /flash-sales?keyword=black&page=0&size=10
     * Returns paginated list for Admin management table.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<PagedResponse<FlashSaleResponse>> getAll(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(flashSaleService.getAll(keyword, page, size));
    }

    /**
     * GET /flash-sales/{id}
     * Full detail including items — used by Admin edit form.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<FlashSaleResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(flashSaleService.getById(id));
    }

    /**
     * POST /flash-sales
     * Creates a campaign with its items in one atomic transaction.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<FlashSaleResponse> create(@RequestBody FlashSaleRequest request) {
        FlashSaleResponse created = flashSaleService.create(request);
        return ResponseEntity
                .created(URI.create("/api/v1/flash-sales/" + created.id()))
                .body(created);
    }

    /**
     * PUT /flash-sales/{id}
     * Full replacement of campaign + items.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<FlashSaleResponse> update(
            @PathVariable Long id,
            @RequestBody FlashSaleRequest request
    ) {
        return ResponseEntity.ok(flashSaleService.update(id, request));
    }

    /**
     * DELETE /flash-sales/{id}
     * Cascades to flash_sale_items automatically.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        flashSaleService.delete(id);
        return ResponseEntity.noContent().build();
    }
}