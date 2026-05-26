package com.capstone.mbservices.dto.request;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class DiscountCodeRequest {
    private String code;
    private Double discountPercentage;
    private Double maxDiscountAmount;
    private LocalDateTime validFrom;
    private LocalDateTime validTo;
    private Integer maxUsages;
    private Boolean isActive;
    
    public String getCode() { return code; }
    public Double getDiscountPercentage() { return discountPercentage; }
    public Double getMaxDiscountAmount() { return maxDiscountAmount; }
    public LocalDateTime getValidFrom() { return validFrom; }
    public LocalDateTime getValidTo() { return validTo; }
    public Integer getMaxUsages() { return maxUsages; }
    public Boolean getIsActive() { return isActive; }
}
