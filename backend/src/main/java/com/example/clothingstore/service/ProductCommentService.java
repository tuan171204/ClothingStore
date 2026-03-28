package com.example.clothingstore.service;

import com.example.clothingstore.dto.request.CommentRequest;
import com.example.clothingstore.dto.response.CommentResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ProductCommentService {
    public Page<CommentResponse> getCommentsByProduct(Long productId, Pageable pageable);
    public CommentResponse createComment(Long productId, CommentRequest request);
    public void deleteComment(Long commentId);

}
