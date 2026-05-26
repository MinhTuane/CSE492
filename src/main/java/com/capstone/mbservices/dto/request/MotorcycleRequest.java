package com.capstone.mbservices.dto.request;

import java.util.List;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MotorcycleRequest {
    @NotBlank(message = "Brand is required")
    private String brand;
    
    @NotBlank(message = "Model is required")
    private String model;
    
    @NotNull(message = "Year is required")
    private Integer year;
    
    private String category;
    
    @NotNull(message = "Price is required")
    @Min(value = 0, message = "Price must be positive")
    private Double price;
    
    private Double discountPercentage;
    
    private String description;
    private String engineType;
    private Integer displacement;
    private Double power;
    private Double torque;
    private Double weight;
    private Double topSpeed;
    private Double fuelCapacity;
    private Integer stock;
    private List<String> images;
    private List<String> features;
    private String color;

    public String getBrand() {
        return brand;
    }
    public String getModel() {
        return model;
    }
    public Integer getYear() {
        return year;
    }
    public String getCategory() {
        return category;
    }
    public Double getPrice() {
        return price;
    }
    public Double getDiscountPercentage() {
        return discountPercentage;
    }
    public String getDescription() {
        return description;
    }
    public String getEngineType() {
        return engineType;
    }
    public Integer getDisplacement() {
        return displacement;
    }
    public Double getPower() {
        return power;
    }
    public Double getTorque() {
        return torque;
    }
    public Double getWeight() {
        return weight;
    }
    public Double getTopSpeed() {
        return topSpeed;
    }
    public Double getFuelCapacity() {
        return fuelCapacity;
    }
    public Integer getStock() {
        return stock;
    }
    public List<String> getImages() {
        return images;
    }
    public List<String> getFeatures() {
        return features;
    }
    public String getColor() {
        return color;
    }
}
