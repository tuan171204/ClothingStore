package com.example.clothingstore.repository;

import com.example.clothingstore.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    // Lấy thông báo cho 1 user cụ thể HOẶC thông báo chung cho toàn hệ thống (recipientId = null)
    List<Notification> findByRecipientIdOrRecipientIdIsNullOrderByCreatedAtDesc(String recipientId);

    // Đếm số thông báo chưa đọc
    long countByRecipientIdAndIsReadFalse(String recipientId);
    long countByRecipientIdIsNullAndIsReadFalse();
}