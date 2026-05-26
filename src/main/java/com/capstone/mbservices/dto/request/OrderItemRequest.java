package com.capstone.mbservices.dto.request;

import com.capstone.mbservices.enums.ItemType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OrderItemRequest {
    
    @NotNull(message = "Item type is required")
    private ItemType itemType;
    
    @NotBlank(message = "Item ID is required")
    private String itemId;
    
    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;
}
