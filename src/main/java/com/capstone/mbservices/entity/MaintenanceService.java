package com.capstone.mbservices.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;
import com.capstone.mbservices.enums.ServiceStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;

@Entity
@Table(name = "maintenance_services")
@Data
@ToString(exclude = {"user", "motorcycle", "technician"})
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenanceService {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToOne
    @JoinColumn(name = "motorcycle_id", nullable = false)
    private Motorcycle motorcycle;
    
    private String serviceType;
    private String description;
    private LocalDateTime scheduleDate;
    
    @Enumerated(EnumType.STRING)
    private ServiceStatus status = ServiceStatus.SCHEDULED;
    
    private Double cost;
    private String bundleId;
    
    @Column(length = 1000)
    private String notes;
    
    @ManyToOne
    @JoinColumn(name = "technician_id")
    private Staff technician;
    
    @ManyToOne
    @JoinColumn(name = "store_id")
    private Store store;
    
    @CreationTimestamp
    private LocalDateTime createAt;
    
    private LocalDateTime completedAt;
    
    private String googleCalendarEventId;

    public void setStatus(com.capstone.mbservices.enums.ServiceStatus status) {
        this.status = status;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public void setMotorcycle(Motorcycle motorcycle) {
        this.motorcycle = motorcycle;
    }

    public void setServiceType(String serviceType) {
        this.serviceType = serviceType;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setScheduleDate(LocalDateTime scheduleDate) {
        this.scheduleDate = scheduleDate;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public void setTechnician(Staff technician) {
        this.technician = technician;
    }

    public void setStore(Store store) {
        this.store = store;
    }

    public void setCost(Double cost) {
        this.cost = cost;
    }
    
    public Motorcycle getMotorcycle() {
        return motorcycle;
    }
    
    public Store getStore() {
        return store;
    }
    
    public LocalDateTime getCreateAt() {
        return createAt;
    }

    public static class Builder {
        private User user;
        private Motorcycle motorcycle;
        private Store store;
        private String serviceType;
        private String description;
        private LocalDateTime scheduleDate;
        private String notes;
        private com.capstone.mbservices.enums.ServiceStatus status;
        private Double cost;
        private String bundleId;
        private LocalDateTime createAt;

        public Builder user(User user) { this.user = user; return this; }
        public Builder motorcycle(Motorcycle motorcycle) { this.motorcycle = motorcycle; return this; }
        public Builder store(Store store) { this.store = store; return this; }
        public Builder serviceType(String serviceType) { this.serviceType = serviceType; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder scheduleDate(LocalDateTime scheduleDate) { this.scheduleDate = scheduleDate; return this; }
        public Builder notes(String notes) { this.notes = notes; return this; }
        public Builder status(com.capstone.mbservices.enums.ServiceStatus status) { this.status = status; return this; }
        public Builder cost(Double cost) { this.cost = cost; return this; }
        public Builder bundleId(String bundleId) { this.bundleId = bundleId; return this; }
        public Builder createAt(LocalDateTime createAt) { this.createAt = createAt; return this; }

        public MaintenanceService build() {
            MaintenanceService ms = new MaintenanceService();
            ms.user = this.user;
            ms.motorcycle = this.motorcycle;
            ms.store = this.store;
            ms.serviceType = this.serviceType;
            ms.description = this.description;
            ms.scheduleDate = this.scheduleDate;
            ms.notes = this.notes;
            ms.status = this.status != null ? this.status : com.capstone.mbservices.enums.ServiceStatus.SCHEDULED;
            ms.cost = this.cost;
            ms.bundleId = this.bundleId;
            ms.createAt = this.createAt;
            return ms;
        }
    }

    public static Builder builder() {
        return new Builder();
    }
}
