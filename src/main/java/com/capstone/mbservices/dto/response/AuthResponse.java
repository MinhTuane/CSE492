package com.capstone.mbservices.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    @Builder.Default
    private String type = "Bearer";
    private String id;
    private String email;
    private String username;
    private String authProvider;
    private Boolean hasLocalCredentials;
    private String firstname;
    private String lastname;
    private String phone;
    private String address;
    private String role;
}
