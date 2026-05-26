package com.capstone.mbservices.dto.request;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ServiceUpdateRequest {
    private String userId;
    private String motorcycleId;
    private String serviceType;
    private LocalDateTime scheduleDate;
    private String description;
    private String notes;
    private Double cost;
    private String technicianId;
    private String status; // ServiceStatus as string

    public String getUserId() {
        return userId;
    }

    public String getMotorcycleId() {
        return motorcycleId;
    }

    public String getServiceType() {
        return serviceType;
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

    public Double getCost() {
        return cost;
    }

    public String getTechnicianId() {
        return technicianId;
    }

    public String getStatus() {
        return status;
    }
}
