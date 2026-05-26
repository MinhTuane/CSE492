package com.capstone.mbservices.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;
import com.capstone.mbservices.enums.TestRideStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;

@Entity
@Table(name = "test_rides")
@Data
@ToString(exclude = {"user", "motorcycle", "store", "assignedStaff"})
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestRide {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToOne
    @JoinColumn(name = "motorcycle_id", nullable = false)
    private Motorcycle motorcycle;
    
    private LocalDateTime scheduleDate;
    private LocalDateTime scheduleDateTime;
    private Integer duration; // in minutes
    
    @Enumerated(EnumType.STRING)
    private TestRideStatus status = TestRideStatus.PENDING;
    
    private String location;
    private String notes;
    
    @CreationTimestamp
    private LocalDateTime createAt;
    
    private LocalDateTime confirmedAt;
    private LocalDateTime completedAt;

    @ManyToOne
    @JoinColumn(name = "store_id")
    private Store store;

    @ManyToOne
    @JoinColumn(name = "assigned_staff_id")
    private Staff assignedStaff;

    private LocalDateTime proposedDate;
    private LocalDateTime assignedAt;

    private String googleCalendarEventId;

    public static class Builder {
        private User user;
        private Motorcycle motorcycle;
        private LocalDateTime scheduleDate;
        private LocalDateTime scheduleDateTime;
        private Integer duration;
        private TestRideStatus status;
        private String location;
        private String notes;
        private Store store;
        private LocalDateTime createAt;
        private LocalDateTime confirmedAt;
        private LocalDateTime assignedAt;
        private Staff assignedStaff;

        public Builder user(User user) { this.user = user; return this; }
        public Builder motorcycle(Motorcycle motorcycle) { this.motorcycle = motorcycle; return this; }
        public Builder scheduleDate(LocalDateTime scheduleDate) { this.scheduleDate = scheduleDate; return this; }
        public Builder scheduleDateTime(LocalDateTime scheduleDateTime) { this.scheduleDateTime = scheduleDateTime; return this; }
        public Builder duration(Integer duration) { this.duration = duration; return this; }
        public Builder status(TestRideStatus status) { this.status = status; return this; }
        public Builder location(String location) { this.location = location; return this; }
        public Builder notes(String notes) { this.notes = notes; return this; }
        public Builder store(Store store) { this.store = store; return this; }
        public Builder createAt(LocalDateTime createAt) { this.createAt = createAt; return this; }
        public Builder confirmedAt(LocalDateTime confirmedAt) { this.confirmedAt = confirmedAt; return this; }
        public Builder assignedAt(LocalDateTime assignedAt) { this.assignedAt = assignedAt; return this; }
        public Builder assignedStaff(Staff assignedStaff) { this.assignedStaff = assignedStaff; return this; }

        public TestRide build() {
            TestRide tr = new TestRide();
            tr.user = this.user;
            tr.motorcycle = this.motorcycle;
            tr.scheduleDate = this.scheduleDate;
            tr.scheduleDateTime = this.scheduleDateTime;
            tr.duration = this.duration;
            tr.status = this.status != null ? this.status : TestRideStatus.PENDING;
            tr.location = this.location;
            tr.notes = this.notes;
            tr.store = this.store;
            tr.createAt = this.createAt;
            tr.confirmedAt = this.confirmedAt;
            tr.assignedAt = this.assignedAt;
            tr.assignedStaff = this.assignedStaff;
            return tr;
        }
    }

    public static Builder builder() {
        return new Builder();
    }

    public TestRideStatus getStatus() {
        return status;
    }

    public void setStatus(TestRideStatus status) {
        this.status = status;
    }

    public void setConfirmedAt(LocalDateTime confirmedAt) {
        this.confirmedAt = confirmedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getNotes() {
        return notes;
    }

    public void setAssignedStaff(Staff assignedStaff) {
        this.assignedStaff = assignedStaff;
    }

    public void setAssignedAt(LocalDateTime assignedAt) {
        this.assignedAt = assignedAt;
    }

    public void setStore(Store store) {
        this.store = store;
    }

    public void setScheduleDate(LocalDateTime scheduleDate) {
        this.scheduleDate = scheduleDate;
    }

    public void setScheduleDateTime(LocalDateTime scheduleDateTime) {
        this.scheduleDateTime = scheduleDateTime;
    }

    public void setProposedDate(LocalDateTime proposedDate) {
        this.proposedDate = proposedDate;
    }
}
