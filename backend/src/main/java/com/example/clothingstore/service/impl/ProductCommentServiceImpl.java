package com.example.clothingstore.service.impl;

import com.example.clothingstore.dto.request.CommentRequest;
import com.example.clothingstore.dto.response.CommentResponse;
import com.example.clothingstore.entity.ProductComment;
import com.example.clothingstore.entity.User;
import com.example.clothingstore.exception.AppException;
import com.example.clothingstore.exception.ErrorCode;
import com.example.clothingstore.repository.ProductCommentRepository;
import com.example.clothingstore.repository.ProductRepository;
import com.example.clothingstore.repository.UserRepository;
import com.example.clothingstore.service.ProductCommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductCommentServiceImpl implements ProductCommentService {

    private final ProductCommentRepository commentRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    // ----------------------------------------------------------------
    // LẤY DANH SÁCH COMMENT (kèm replies) theo productId
    // ----------------------------------------------------------------
    @Transactional(readOnly = true)
    public Page<CommentResponse> getCommentsByProduct(Long productId, Pageable pageable) {
        Page<ProductComment> rootPage = commentRepository.findRootCommentsByProduct(productId, pageable);

        List<CommentResponse> dtos = rootPage.getContent().stream()
                .map(c -> toResponse(c, true))
                .collect(Collectors.toList());

        return new PageImpl<>(dtos, pageable, rootPage.getTotalElements());
    }

    // ----------------------------------------------------------------
    // THÊM COMMENT MỚI (hoặc reply)
    // ----------------------------------------------------------------
    @Transactional
    public CommentResponse createComment(Long productId, CommentRequest request) {
        String currentUserId = getCurrentUserId();

        if (!productRepository.existsById(productId)) {
            throw new AppException(ErrorCode.INVALID_DATA);
        }

        ProductComment comment = ProductComment.builder()
                .productId(productId)
                .userId(currentUserId)
                .content(request.getContent().trim())
                .status(ProductComment.CommentStatus.APPROVED) // Tự động duyệt, đổi thành PENDING nếu muốn moderation
                .build();

        // Nếu là reply, gán parent
        if (request.getParentId() != null) {
            ProductComment parent = commentRepository.findById(request.getParentId())
                    .orElseThrow(() -> new AppException(ErrorCode.INVALID_DATA));

            // Chỉ cho phép reply 1 cấp (không reply của reply)
            if (parent.getParent() != null) {
                throw new AppException(ErrorCode.INVALID_DATA);
            }
            comment.setParent(parent);
        }

        return toResponse(commentRepository.save(comment), false);
    }

    // ----------------------------------------------------------------
    // XÓA COMMENT (Chỉ chủ comment hoặc Admin)
    // ----------------------------------------------------------------
    @Transactional
    public void deleteComment(Long commentId) {
        String currentUserId = getCurrentUserId();

        ProductComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_DATA));

        boolean isOwner = comment.getUserId().equals(currentUserId);
        // TODO: thêm check isAdmin nếu cần

        if (!isOwner) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        commentRepository.delete(comment);
    }

    // ================================================================
    // HELPER METHODS
    // ================================================================

    private String getCurrentUserId() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        if (username == null || "anonymousUser".equals(username)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        return userRepository.findByUsername(username)
                .map(User::getId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    public CommentResponse toResponse(ProductComment comment, boolean includeReplies) {
        // Lấy thông tin user để hiển thị tên
        String displayName = userRepository.findById(comment.getUserId())
                .map(u -> u.getFullName() != null ? u.getFullName() : u.getUsername())
                .orElse("Người dùng ẩn danh");

        String avatar = userRepository.findById(comment.getUserId())
                .map(User::getAvatar)
                .orElse(null);

        List<CommentResponse> replies = Collections.emptyList();
        if (includeReplies && comment.getReplies() != null) {
            replies = comment.getReplies().stream()
                    .filter(r -> r.getStatus() == ProductComment.CommentStatus.APPROVED)
                    .map(r -> toResponse(r, false))
                    .collect(Collectors.toList());
        }

        return CommentResponse.builder()
                .id(comment.getId())
                .productId(comment.getProductId())
                .userId(comment.getUserId())
                .userDisplayName(displayName)
                .userAvatar(avatar)
                .content(comment.getContent())
                .parentId(comment.getParent() != null ? comment.getParent().getId() : null)
                .status(comment.getStatus().name())
                .createdAt(comment.getCreatedAt())
                .replies(replies)
                .build();
    }
}