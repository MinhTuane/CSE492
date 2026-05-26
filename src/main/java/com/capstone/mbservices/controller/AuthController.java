package com.capstone.mbservices.controller;

import lombok.RequiredArgsConstructor;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.capstone.mbservices.dto.request.*;
import com.capstone.mbservices.dto.response.AuthResponse;
import com.capstone.mbservices.service.AuthService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth") // NO /api prefix! context-path adds it
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }
    
    @PostMapping("/register-username")
    public ResponseEntity<AuthResponse> registerWithUsername(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");
        return ResponseEntity.ok(authService.registerWithUsername(username, password));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/oauth/google")
    public ResponseEntity<AuthResponse> loginWithGoogle(@Valid @RequestBody GoogleLoginRequest request) {
        return ResponseEntity.ok(authService.loginWithGoogle(request.getIdToken()));
    }

    @PostMapping("/oauth/facebook")
    public ResponseEntity<AuthResponse> loginWithFacebook(@Valid @RequestBody FacebookLoginRequest request) {
        return ResponseEntity.ok(authService.loginWithFacebook(request.getAccessToken()));
    }
}
