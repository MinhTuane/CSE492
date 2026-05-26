package com.capstone.mbservices.dto.request;

import java.time.LocalDateTime;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TestRideRequest {
    @NotBlank(message = "User ID is required")
    private String userId;
    
    @NotBlank(message = "Motorcycle ID is required")
    private String motorcycleId;
    
    @NotBlank(message = "Store ID is required")
    private String storeId;
    
    @NotNull(message = "Schedule date is required")
    private LocalDateTime scheduleDate;
    
    @NotNull(message = "Duration is required")
    @Min(value = 15, message = "Duration must be at least 15 minutes")
    private Integer duration;
    
    private String location;
    private String notes;

    public String getUserId() {
        return userId;
    }

    public String getMotorcycleId() {
        return motorcycleId;
    }

    public String getStoreId() {
        return storeId;
    }

    public LocalDateTime getScheduleDate() {
        return scheduleDate;
    }

    public Integer getDuration() {
        return duration;
    }

    public String getLocation() {
        return location;
    }

    public String getNotes() {
        return notes;
    }
}
