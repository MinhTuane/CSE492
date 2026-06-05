package com.capstone.mbservices.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;
import jakarta.validation.constraints.*;

@Entity
@Table(
    name = "reviews",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_review_user_motorcycle",
        columnNames = {"user_id", "motorcycle_id"}
    )
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Review {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToOne
    @JoinColumn(name = "motorcycle_id", nullable = false)
    private Motorcycle motorcycle;
    
    @Min(1) @Max(5)
    private Integer rating;
    
    
    @Column(columnDefinition = "NVARCHAR(255)")
    private String title;

    @Column(columnDefinition = "NVARCHAR(2000)")
    private String content;
    
    @ElementCollection
    private List<String> images;
    
    @CreationTimestamp
    private LocalDateTime createAt;
    
    @Builder.Default
    private Boolean isApproved = false;
    @Builder.Default
    private Boolean isFlagged = false;
    
    @Builder.Default
    private Integer helpfulCount = 0;
}
