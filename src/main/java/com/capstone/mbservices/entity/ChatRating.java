package com.capstone.mbservices.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_ratings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatRating {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String customerId;

    private String staffId;

    private String staffName;

    @Column(nullable = false)
    private Integer rating;

    @Column(length = 2000)
    private String feedback;

    @CreationTimestamp
    private LocalDateTime createAt;
}
