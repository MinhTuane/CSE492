package com.capstone.mbservices.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import com.capstone.mbservices.enums.MotorcycleStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "motorcycles")
@Data
@ToString(exclude = {"reviews", "testRides"})
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Motorcycle {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(nullable = false)
    private String brand;
    
    @Column(nullable = false)
    private String model;
    
    private Integer year;
    private String category;
    
    @Column(nullable = false)
    private Double price;
    
    @Builder.Default
    private Double discountPercentage = 0.0;
    
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private MotorcycleStatus status = MotorcycleStatus.AVAILABLE;
    
    @Column(length = 2000)
    private String description;
    
    private String engineType;
    private Integer displacement;
    private Double power;
    private Double torque;
    private Double weight;
    private Double topSpeed;
    private Double fuelCapacity;
    @Builder.Default
    private Integer stock = 0;
    
    @ElementCollection
    @org.hibernate.annotations.BatchSize(size = 50)
    private List<String> images;
    
    @ElementCollection
    @org.hibernate.annotations.BatchSize(size = 50)
    private List<String> features;
    
    private String color;
    
    @CreationTimestamp
    private LocalDateTime createAt;
    
    @UpdateTimestamp
    private LocalDateTime updateAt;
    
    @OneToMany(mappedBy = "motorcycle", cascade = CascadeType.ALL)
    @org.hibernate.annotations.BatchSize(size = 50)
    @JsonIgnore
    private List<Review> reviews;
    
    @OneToMany(mappedBy = "motorcycle")
    @JsonIgnore
    private List<TestRide> testRides;
    
    @Transient
    public Double getAverageRating() {
        if (reviews == null || reviews.isEmpty()) {
            return 0.0;
        }
        return reviews.stream()
            .mapToInt(Review::getRating)
            .average()
            .orElse(0.0);
    }
    
    public String getId() {
        return id;
    }
    public Integer getStock() {
        return stock;
    }
    public void setStock(Integer stock) {
        this.stock = stock;
    }
    public com.capstone.mbservices.enums.MotorcycleStatus getStatus() {
        return status;
    }
    public void setStatus(com.capstone.mbservices.enums.MotorcycleStatus status) {
        this.status = status;
    }
    public void setTopSpeed(Double topSpeed) {
        this.topSpeed = topSpeed;
    }
    public void setFuelCapacity(Double fuelCapacity) {
        this.fuelCapacity = fuelCapacity;
    }
    public void setImages(java.util.List<String> images) {
        this.images = images;
    }
    public void setFeatures(java.util.List<String> features) {
        this.features = features;
    }
    public void setColor(String color) {
        this.color = color;
    }
}
