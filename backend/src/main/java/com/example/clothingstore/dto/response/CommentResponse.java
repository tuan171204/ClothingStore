package com.example.clothingstore.dto.response;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentResponse {
    private Long id;
    private Long productId;
    private String userId;
    private String userDisplayName; // Snapshot tên user
    private String userAvatar;      // Snapshot avatar
    private String content;
    private Long parentId;
    private String status;
    private LocalDateTime createdAt;
    private List<CommentResponse> replies;
}