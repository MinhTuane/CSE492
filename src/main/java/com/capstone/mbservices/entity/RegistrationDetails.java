package com.capstone.mbservices.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "registration_details")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegistrationDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @OneToOne
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    private String idCardNumber;
    private String province;
    private String district;
    private Boolean dealerAssisted;
    private String licensePlate;
    private String status;
}
