package com.capstone.mbservices.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "discount_codes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiscountCode {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(unique = true, nullable = false)
    private String code;
    
    @Column(nullable = false)
    private Double discountPercentage; // e.g., 10.0 for 10%
    
    private Double maxDiscountAmount; // e.g., 500000 for max 500k VND off
    
    private LocalDateTime validFrom;
    
    private LocalDateTime validTo;
    
    private Integer maxUsages;
    
    @Builder.Default
    private Integer currentUsages = 0;
    
    @Builder.Default
    private Boolean isActive = true;
    
    @CreationTimestamp
    private LocalDateTime createAt;

    public String getId() { return id; }
    public String getCode() { return code; }
    public Double getDiscountPercentage() { return discountPercentage; }
    public Double getMaxDiscountAmount() { return maxDiscountAmount; }
    public LocalDateTime getValidFrom() { return validFrom; }
    public LocalDateTime getValidTo() { return validTo; }
    public Integer getMaxUsages() { return maxUsages; }
    public Integer getCurrentUsages() { return currentUsages; }
    public Boolean getIsActive() { return isActive; }
    public void setCurrentUsages(Integer currentUsages) { this.currentUsages = currentUsages; }
    public void setCode(String code) { this.code = code; }
    public void setDiscountPercentage(Double discountPercentage) { this.discountPercentage = discountPercentage; }
    public void setMaxDiscountAmount(Double maxDiscountAmount) { this.maxDiscountAmount = maxDiscountAmount; }
    public void setValidFrom(LocalDateTime validFrom) { this.validFrom = validFrom; }
    public void setValidTo(LocalDateTime validTo) { this.validTo = validTo; }
    public void setMaxUsages(Integer maxUsages) { this.maxUsages = maxUsages; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}
