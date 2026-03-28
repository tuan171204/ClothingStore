package com.example.clothingstore.controller;

import com.example.clothingstore.dto.request.CommentRequest;
import com.example.clothingstore.dto.response.ApiResponse;
import com.example.clothingstore.dto.response.CommentResponse;
import com.example.clothingstore.service.impl.ProductCommentServiceImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("${api.prefix}")
@RequiredArgsConstructor
public class ProductCommentController {

    private final ProductCommentServiceImpl commentService;

    /**
     * GET /products/{productId}/comments
     * Public: Ai cũng xem được bình luận
     */
    @GetMapping("/products/{productId}/comments")
    public ApiResponse<Page<CommentResponse>> getComments(
            @PathVariable Long productId,
            @PageableDefault(size = 15) Pageable pageable
    ) {
        return ApiResponse.<Page<CommentResponse>>builder()
                .result(commentService.getCommentsByProduct(productId, pageable))
                .build();
    }

    /**
     * POST /products/{productId}/comments
     * Phải đăng nhập mới được bình luận
     */
    @PostMapping("/products/{productId}/comments")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<CommentResponse> createComment(
            @PathVariable Long productId,
            @Valid @RequestBody CommentRequest request
    ) {
        return ApiResponse.<CommentResponse>builder()
                .result(commentService.createComment(productId, request))
                .build();
    }

    /**
     * DELETE /comments/{commentId}
     * Chỉ chủ comment mới được xóa
     */
    @DeleteMapping("/comments/{commentId}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<String> deleteComment(@PathVariable Long commentId) {
        commentService.deleteComment(commentId);
        return ApiResponse.<String>builder()
                .result("Đã xóa bình luận")
                .build();
    }
}