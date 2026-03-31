package com.example.clothingstore.repository;

import com.example.clothingstore.entity.ProductComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductCommentRepository extends JpaRepository<ProductComment, Long> {

    /** Lấy tất cả comment gốc (parent = null) của 1 sản phẩm, đã APPROVED */
    @Query("""
        SELECT c FROM ProductComment c
        WHERE c.productId = :productId
          AND c.parent IS NULL
          AND c.status = 'APPROVED'
        ORDER BY c.createdAt DESC
        """)
    Page<ProductComment> findRootCommentsByProduct(
            @Param("productId") Long productId,
            Pageable pageable
    );

    /** Lấy replies của 1 comment cha */
    List<ProductComment> findByParentIdAndStatus(
            Long parentId,
            ProductComment.CommentStatus status
    );

    /** Admin: Lấy comment đang chờ duyệt */
    Page<ProductComment> findByStatusOrderByCreatedAtAsc(
            ProductComment.CommentStatus status,
            Pageable pageable
    );
}