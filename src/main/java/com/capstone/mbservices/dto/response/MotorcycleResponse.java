package com.capstone.mbservices.dto.response;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MotorcycleResponse {

    private String id;
    private String brand;
    private String model;
    private Integer year;
    private String category;
    private Double price;
    private String status;
    private String description;

    private String engineType;
    private Integer displacement;
    private Double power;
    private Double torque;
    private Double weight;
    private Double topSpeed;
    private Double fuelCapacity;

    private Integer stock;
    private String color;

    private List<String> images;
    private List<String> features;

    private Double averageRating;
    private Integer reviewCount;

    private LocalDateTime createAt;
    private LocalDateTime updateAt;
}
