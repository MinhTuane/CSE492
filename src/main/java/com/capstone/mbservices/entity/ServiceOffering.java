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

    @Column(nullable = false, length = 200)
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
    private Boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id")
    private Store store;

    @CreationTimestamp
    private LocalDateTime createAt;

    @UpdateTimestamp
    private LocalDateTime updateAt;

    public Long getPrice() {
        return price;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setSubtitle(String subtitle) {
        this.subtitle = subtitle;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setPrice(Long price) {
        this.price = price;
    }

    public void setFeatures(List<String> features) {
        this.features = features;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public static class Builder {
        private String name;
        private String subtitle;
        private String description;
        private Long price;
        private java.util.List<String> features;
        private Boolean active;
        private com.capstone.mbservices.entity.Store store;

        public Builder name(String name) { this.name = name; return this; }
        public Builder subtitle(String subtitle) { this.subtitle = subtitle; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder price(Long price) { this.price = price; return this; }
        public Builder features(java.util.List<String> features) { this.features = features; return this; }
        public Builder active(Boolean active) { this.active = active; return this; }
        public Builder store(com.capstone.mbservices.entity.Store store) { this.store = store; return this; }

        public ServiceOffering build() {
            ServiceOffering so = new ServiceOffering();
            so.name = this.name;
            so.subtitle = this.subtitle;
            so.description = this.description;
            so.price = this.price;
            so.features = this.features;
            so.active = this.active != null ? this.active : Boolean.TRUE;
            so.store = this.store;
            return so;
        }
    }

    public static Builder builder() {
        return new Builder();
    }
}
