package com.capstone.mbservices.entity;

import java.util.List;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "staff")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Staff {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @OneToOne
    @JoinColumn(name = "user_id", unique = true)
    private User user;
    
    @ElementCollection
    private List<String> permissions;
    
    private String department;
    private String position;

    @ManyToOne
    @JoinColumn(name = "store_id")
    private Store store;
}
