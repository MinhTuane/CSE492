package com.capstone.mbservices.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;

@Entity
@Table(name = "forum_comments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForumComment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne
    @JoinColumn(name = "post_id", nullable = false)
    @JsonIgnore
    private ForumPost post;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(length = 2000, nullable = false)
    private String content;

    @CreationTimestamp
    private LocalDateTime createAt;

    @Builder.Default
    private Boolean isHidden = false;
    @Builder.Default
    private Boolean isFlagged = false;
}
