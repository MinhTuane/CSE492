package com.capstone.mbservices.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.util.List;

@Data
public class StaffRequest {
    
    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;
    
    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;
    
    @NotBlank(message = "First name is required")
    private String firstname;
    
    @NotBlank(message = "Last name is required")
    private String lastname;
    
    @NotBlank(message = "Phone is required")
    private String phone;
    
    private String address;
    
    @NotNull(message = "Permissions are required")
    private List<String> permissions;
}
