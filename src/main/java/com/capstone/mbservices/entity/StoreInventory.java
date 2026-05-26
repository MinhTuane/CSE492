package com.capstone.mbservices.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "store_inventory")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoreInventory {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;

    @ManyToOne
    @JoinColumn(name = "motorcycle_id", nullable = false)
    private Motorcycle motorcycle;

    @Column(nullable = false)
    @Builder.Default
    private Integer stock = 0;
}
