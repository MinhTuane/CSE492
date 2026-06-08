package com.capstone.mbservices.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String customerId;

    private String senderId;

    private String senderName;

    @Column(nullable = false)
    private String senderRole; // "CUSTOMER", "STAFF", "BOT", "SYSTEM"

    @Column(length = 2000, nullable = false)
    private String content;

    @CreationTimestamp
    private LocalDateTime createAt;
}
