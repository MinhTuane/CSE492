package com.capstone.mbservices.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "service_offerings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceOffering {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(length = 200, nullable = false)
    private String name;

    @Column(length = 300)
    private String subtitle;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false)
    private Long price;

    @ElementCollection
    @CollectionTable(name = "service_offering_features", joinColumns = @JoinColumn(name = "offering_id"))
    @Column(name = "feature", length = 300)
    private List<String> features;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id")
    private Store store;

    @CreationTimestamp
    private LocalDateTime createAt;

    @UpdateTimestamp
    private LocalDateTime updateAt;

}
