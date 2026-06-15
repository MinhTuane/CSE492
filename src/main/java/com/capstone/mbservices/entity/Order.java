package com.capstone.mbservices.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import com.capstone.mbservices.enums.OrderStatus;
import com.capstone.mbservices.enums.PaymentMethod;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(unique = true, nullable = false)
    private String orderNumber;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToMany
    @JoinTable(
        name = "order_motorcycles",
        joinColumns = @JoinColumn(name = "order_id"),
        inverseJoinColumns = @JoinColumn(name = "motorcycle_id")
    )
    @org.hibernate.annotations.BatchSize(size = 50)
    @Deprecated // Use orderItems instead
    private List<Motorcycle> motorcycles;

    @ManyToMany
    @JoinTable(
        name = "order_accessories",
        joinColumns = @JoinColumn(name = "order_id"),
        inverseJoinColumns = @JoinColumn(name = "accessory_id")
    )
    @org.hibernate.annotations.BatchSize(size = 50)
    @Deprecated // Use orderItems instead
    private List<Accessory> accessories;
    
    // New: Order items with quantities
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> orderItems;
    
    private Double totalAmount;
    private Double taxAmount;
    private Double shippingFee;
    private Double discountAmount;
    private String discountCode;
    private Integer loyaltyPointsRedeemed;

    @Builder.Default
    private Boolean paymentSettlementDone = false;

    private Boolean useLoyaltyPoints;
    
    @Builder.Default
    private Boolean isDeposit = false;
    
    private Double depositAmount;
    private Double remainingAmount;
    
    @Enumerated(EnumType.STRING)
    private PaymentMethod paymentMethod;
    
    private String transactionId;
    
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private OrderStatus status = OrderStatus.PENDING;
    
    @Column(length = 1000)
    private String shippingAddress;

    @Column(length = 2000)
    private String notes;
    
    @ManyToOne
    @JoinColumn(name = "store_id")
    private Store store;
    
    @CreationTimestamp
    private LocalDateTime createAt;
    
    private LocalDateTime paidAt;
    private LocalDateTime shippedAt;
    private LocalDateTime deliveredAt;
    
}
