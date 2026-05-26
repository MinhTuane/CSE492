package com.capstone.mbservices.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "sos_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SosRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String userId; // Optional, can be guest
    
    @Column(nullable = false)
    private String phone;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    private String description;

    @Column(nullable = false)
    private String status; // PENDING, DISPATCHED, RESOLVED

    @CreationTimestamp
    private LocalDateTime createAt;
}