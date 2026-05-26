package com.capstone.mbservices.dto.request;

import java.util.List;

import com.capstone.mbservices.enums.PaymentMethod;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OrderRequest {
    @NotBlank(message = "User ID is required")
    private String userId;
    
    // New: List of items with quantities
    @NotEmpty(message = "Order must contain at least one item")
    private List<OrderItemRequest> items;
    
    // Deprecated: Keep for backward compatibility, will be removed
    @Deprecated
    private List<String> motorcycleIds;
    
    @Deprecated
    private List<String> accessoryIds;
    
    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;
    
    @NotBlank(message = "Shipping address is required")
    private String shippingAddress;
    
    private String notes;
    private String discountCode;
    
    private Boolean useLoyaltyPoints;
    
    private Boolean isDeposit;
    
    @NotBlank(message = "Store ID is required")
    private String storeId;
    
    public String getUserId() { return userId; }
    public List<OrderItemRequest> getItems() { return items; }
    public List<String> getMotorcycleIds() { return motorcycleIds; }
    public List<String> getAccessoryIds() { return accessoryIds; }
    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public String getShippingAddress() { return shippingAddress; }
    public String getNotes() { return notes; }
    public String getDiscountCode() { return discountCode; }
    public Boolean getUseLoyaltyPoints() { return useLoyaltyPoints; }
    public Boolean getIsDeposit() { return isDeposit; }
    public String getStoreId() { return storeId; }
}