package com.capstone.mbservices.controller;

import com.capstone.mbservices.entity.Notification;
import com.capstone.mbservices.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {
    
    private final NotificationService notificationService;

    // --- Admin Endpoints ---
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Notification>> getAdminNotifications() {
        return ResponseEntity.ok(notificationService.getAdminNotifications());
    }

    @GetMapping("/admin/unread-count")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Long> getAdminUnreadCount() {
        return ResponseEntity.ok(notificationService.getAdminUnreadCount());
    }

    @PutMapping("/admin/mark-all-read")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> markAllAdminAsRead() {
        notificationService.markAllAsReadForAdmin();
        return ResponseEntity.ok().build();
    }

    // --- User Endpoints ---
    @GetMapping("/user/{userId}")
    @PreAuthorize("#userId == authentication.principal.id or hasRole('ADMIN')")
    public ResponseEntity<List<Notification>> getUserNotifications(@PathVariable String userId) {
        return ResponseEntity.ok(notificationService.getUserNotifications(userId));
    }

    @GetMapping("/user/{userId}/unread-count")
    @PreAuthorize("#userId == authentication.principal.id or hasRole('ADMIN')")
    public ResponseEntity<Long> getUserUnreadCount(@PathVariable String userId) {
        return ResponseEntity.ok(notificationService.getUserUnreadCount(userId));
    }

    @PutMapping("/user/{userId}/mark-all-read")
    @PreAuthorize("#userId == authentication.principal.id or hasRole('ADMIN')")
    public ResponseEntity<Void> markAllUserAsRead(@PathVariable String userId) {
        notificationService.markAllAsReadForUser(userId);
        return ResponseEntity.ok().build();
    }

    // --- Common Endpoints ---
    @PutMapping("/{id}/read")
    @PreAuthorize("hasRole('ADMIN') or @notificationRepository.findById(#id).orElse(null)?.user?.id == authentication.principal.id")
    public ResponseEntity<Void> markAsRead(@PathVariable String id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }
}
