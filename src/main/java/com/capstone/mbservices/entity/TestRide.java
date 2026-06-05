package com.capstone.mbservices.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;
import com.capstone.mbservices.enums.TestRideStatus;
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
    @Builder.Default
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

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private com.capstone.mbservices.enums.DepositStatus depositStatus
            = com.capstone.mbservices.enums.DepositStatus.PENDING;

    @Builder.Default
    private Double depositAmount = 200_000.0;

    private LocalDateTime depositPaidAt;
    private String depositTransactionId;
}
