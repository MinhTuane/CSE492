package com.capstone.mbservices.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FacebookLoginRequest {
    @NotBlank(message = "Access Token is required")
    private String accessToken;
    
    public String getAccessToken() {
        return accessToken;
    }
}
