package com.capstone.mbservices.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank(message = "Email or username is required")
    private String identifier;
    
    @NotBlank(message = "Password is required")
    private String password;
}
