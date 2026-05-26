package com.capstone.mbservices.service;

import com.capstone.mbservices.entity.Notification;
import com.capstone.mbservices.entity.User;
import com.capstone.mbservices.repository.NotificationRepository;
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

    public void sendToAdmin(String title, String message, String type, String relatedId) {
        Notification notification = Notification.builder()
                .title(title)
                .message(message)
                .type(type)
                .relatedId(relatedId)
                .isRead(false)
                .build();
        
        notificationRepository.save(notification);
        
        // Broadcast to all admins via websocket
        messagingTemplate.convertAndSend("/topic/admin/notifications", notification);
        log.info("Sent admin notification: {}", title);
    }

    public void sendToUser(User user, String title, String message, String type, String relatedId) {
        if (user == null) return;

        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type)
                .relatedId(relatedId)
                .isRead(false)
                .build();
        
        notificationRepository.save(notification);
        
        // Send specifically to this user
        messagingTemplate.convertAndSend("/topic/user/" + user.getId() + "/notifications", notification);
        log.info("Sent notification to user {}: {}", user.getEmail(), title);
    }

    public List<Notification> getAdminNotifications() {
        return notificationRepository.findByUserIsNullOrderByCreatedAtDesc();
    }

    public List<Notification> getUserNotifications(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public long getAdminUnreadCount() {
        return notificationRepository.countByUserIsNullAndIsReadFalse();
    }

    public long getUserUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markAsRead(String id) {
        notificationRepository.findById(id).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    @Transactional
    public void markAllAsReadForUser(String userId) {
        List<Notification> unread = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(n -> !n.isRead())
                .toList();
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    @Transactional
    public void markAllAsReadForAdmin() {
        List<Notification> unread = notificationRepository.findByUserIsNullOrderByCreatedAtDesc().stream()
                .filter(n -> !n.isRead())
                .toList();
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }
}