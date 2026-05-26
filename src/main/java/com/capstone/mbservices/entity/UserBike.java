package com.capstone.mbservices.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_bikes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserBike {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String brand;
    private String model;
    private Integer year;
    private String licensePlate;
    private String color;
    private Integer currentOdo;
    
    private LocalDateTime nextServiceDate;
    
    private String notes;

    @CreationTimestamp
    private LocalDateTime createAt;
}