package com.capstone.mbservices.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GoogleLoginRequest {
    @NotBlank(message = "ID Token is required")
    private String idToken;
    
    public String getIdToken() {
        return idToken;
    }
}
