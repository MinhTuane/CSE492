package com.capstone.mbservices.repository;

import com.capstone.mbservices.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, String> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);
    List<Notification> findByUserIsNullOrderByCreatedAtDesc(); // Admin notifications
    long countByUserIdAndIsReadFalse(String userId);
    long countByUserIsNullAndIsReadFalse();
}