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
    @Column(columnDefinition = "NVARCHAR(2000)")
    private String description;
    private LocalDateTime scheduleDate;
    
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ServiceStatus status = ServiceStatus.SCHEDULED;
    
    private Double cost;
    private String bundleId;
    
    @Column(columnDefinition = "NVARCHAR(1000)")
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
}
