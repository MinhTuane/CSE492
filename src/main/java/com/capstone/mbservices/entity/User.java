package com.capstone.mbservices.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import com.capstone.mbservices.enums.UserRole;
import com.capstone.mbservices.enums.MembershipTier;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@ToString(exclude = {"orders", "services", "testRides", "reviews"})
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(unique = true, nullable = false)
    private String email;

    @Column(unique = true)
    private String username;
    
    @Column(nullable = false)
    @JsonIgnore
    private String password;

    @Builder.Default
    private String authProvider = "LOCAL";

    @Column(columnDefinition = "bit default 0")
    @Builder.Default
    private Boolean hasLocalCredentials = false;
    
    @Column(columnDefinition = "NVARCHAR(255)")
    private String firstname;

    @Column(columnDefinition = "NVARCHAR(255)")
    private String lastname;

    private String phone;

    @Column(columnDefinition = "NVARCHAR(1000)")
    private String address;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private UserRole role = UserRole.CUSTOMER;
    
    @Builder.Default
    private Boolean isActive = true;
    
    @Column(columnDefinition = "int default 0")
    @Builder.Default
    private Integer loyaltyPoints = 0;
    
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private MembershipTier membershipTier = MembershipTier.BRONZE;
    
    @CreationTimestamp
    private LocalDateTime createAt;
    
    @UpdateTimestamp
    private LocalDateTime updateAt;
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Order> orders;
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<MaintenanceService> services;
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<TestRide> testRides;
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Review> reviews;
}
