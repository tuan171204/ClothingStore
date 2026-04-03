package com.example.clothingstore.service.impl;

import com.example.clothingstore.entity.Notification;
import com.example.clothingstore.entity.Enum.NotificationType;
import com.example.clothingstore.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Hàm tạo và gửi thông báo Real-time
     */
    @Transactional
    public void sendAdminNotification(String title, String message, NotificationType type, String referenceId) {
        // 1. Tạo entity và lưu vào Database
        Notification notification = Notification.builder()
                .recipientId(null) // null = Dành cho tất cả Admin
                .title(title)
                .message(message)
                .type(type)
                .referenceId(referenceId)
                .isRead(false)
                .build();

        Notification savedNotification = notificationRepository.save(notification);

        // 2. Phát sóng (Broadcast) qua WebSocket
        // Bất kỳ Client nào đang subscribe kênh "/topic/admin/notifications" đều sẽ nhận được cục JSON này
        messagingTemplate.convertAndSend("/topic/admin/notifications", savedNotification);

        log.info("📢 Đã gửi thông báo Real-time: [{}] {}", type, title);
    }

    // Các hàm phục vụ REST API cho Frontend lấy lịch sử
    public List<Notification> getAdminNotifications() {
        return notificationRepository.findByRecipientIdOrRecipientIdIsNullOrderByCreatedAtDesc(null);
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(notif -> {
            notif.setRead(true);
            notificationRepository.save(notif);
        });
    }

    @Transactional
    public void markAllAsRead() {
        List<Notification> unreadList = notificationRepository.findByRecipientIdOrRecipientIdIsNullOrderByCreatedAtDesc(null)
                .stream().filter(n -> !n.isRead()).toList();
        unreadList.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unreadList);
    }
}