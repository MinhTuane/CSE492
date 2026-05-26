package com.capstone.mbservices.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user; // The recipient of the notification. Null means broadcast to all/admins

    private String title;
    
    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String message;

    private String type; // e.g., "ORDER", "TEST_RIDE", "SYSTEM"
    
    private String relatedId; // ID of the related entity

    private boolean isRead;

    @CreationTimestamp
    private LocalDateTime createdAt;
}