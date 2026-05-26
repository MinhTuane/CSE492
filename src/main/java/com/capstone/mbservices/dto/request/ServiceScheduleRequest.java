package com.capstone.mbservices.dto.request;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ServiceScheduleRequest {
    @NotBlank(message = "User ID is required")
    private String userId;
    
    @NotBlank(message = "Motorcycle ID is required")
    private String motorcycleId;
    
    @NotBlank(message = "Service type is required")
    private String serviceType;
    
    private String bundleId;
    
    @NotBlank(message = "Store ID is required")
    private String storeId;
    
    @NotNull(message = "Schedule date is required")
    private LocalDateTime scheduleDate;
    
    private String description;
    private String notes;

    public String getUserId() {
        return userId;
    }

    public String getMotorcycleId() {
        return motorcycleId;
    }

    public String getServiceType() {
        return serviceType;
    }
    
    public String getBundleId() {
        return bundleId;
    }
    
    public String getStoreId() {
        return storeId;
    }

    public LocalDateTime getScheduleDate() {
        return scheduleDate;
    }

    public String getDescription() {
        return description;
    }

    public String getNotes() {
        return notes;
    }
}
