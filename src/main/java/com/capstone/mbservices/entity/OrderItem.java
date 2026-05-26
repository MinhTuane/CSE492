package com.capstone.mbservices.entity;

import com.capstone.mbservices.enums.ItemType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "order_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ItemType itemType; // MOTORCYCLE or ACCESSORY
    
    @Column(nullable = false)
    private String itemId; // Motorcycle ID or Accessory ID
    
    @Column(nullable = false)
    private Integer quantity;
    
    @Column(nullable = false)
    private Double unitPrice; // Price at time of order (for price history)
    
    @Column(nullable = false)
    private Double totalPrice; // unitPrice × quantity
    
    // Denormalized fields for easier querying (optional but recommended)
    private String itemName;
    private String itemBrand;
    private String itemModel; // For motorcycles
    private String itemCategory;
    private String itemImageUrl;
    
    // Discount info (if item had discount at time of order)
    private Double discountPercentage;
    private Double originalUnitPrice;
}
