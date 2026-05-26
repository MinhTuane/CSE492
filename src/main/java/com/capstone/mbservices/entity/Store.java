package com.capstone.mbservices.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "stores")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Store {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String address;

    private String phone;

    // Location (Phase 2)
    private Double latitude;
    private Double longitude;

    // Franchise (Phase 3)
    private String brand;
    @Builder.Default
    private Boolean licensed = false;
    private LocalDate contractStart;
    private LocalDate contractEnd;

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public void setLicensed(Boolean licensed) {
        this.licensed = licensed;
    }

    public void setContractStart(LocalDate contractStart) {
        this.contractStart = contractStart;
    }

    public void setContractEnd(LocalDate contractEnd) {
        this.contractEnd = contractEnd;
    }

    public Double getLatitude() {
        return latitude;
    }

    public Double getLongitude() {
        return longitude;
    }
}
