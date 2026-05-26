package com.capstone.mbservices.dto.request;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

@Data
public class ServiceOfferingRequest {
    @NotBlank(message = "Name is required")
    private String name;
    private String subtitle;
    @Size(max = 2000, message = "Description too long")
    private String description;
    @NotNull(message = "Price is required")
    private Long price;
    private List<String> features;
    private Boolean active = true;
    private String storeId;
}
