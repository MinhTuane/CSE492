package com.capstone.mbservices.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "warranty_cards")
@Getter 
@Setter 
@NoArgsConstructor 
@AllArgsConstructor 
@Builder
public class WarrantyCard {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "motorcycle_id", nullable = false)
    private Motorcycle motorcycle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    private String frameNumber;  // Unique Frame Chassis Number
    private String engineNumber; // Unique Engine Serial Number
    
    private LocalDateTime startDate; // Activation Date (Delivery Date)
    private LocalDateTime endDate;   // Expiration Date (3 years later)
    
    private String qrCodeUrl; // Link to QR code hosted on Cloudinary
}
