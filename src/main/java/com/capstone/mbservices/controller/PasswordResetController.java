package com.capstone.mbservices.controller;

import com.capstone.mbservices.dto.request.PasswordResetConfirmRequest;
import com.capstone.mbservices.dto.request.PasswordResetRequest;
import com.capstone.mbservices.service.PasswordResetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth/password-reset")
@RequiredArgsConstructor
public class PasswordResetController {
    
    private final PasswordResetService passwordResetService;
    
    /**
     * Request password reset - sends email with reset link
     */
    @PostMapping("/request")
    public ResponseEntity<Map<String, String>> requestPasswordReset(@Valid @RequestBody PasswordResetRequest request) {
        passwordResetService.requestPasswordReset(request.getEmail());
        return ResponseEntity.ok(Map.of(
            "message", "If an account exists with this email, a password reset link has been sent."
        ));
    }
    
    /**
     * Verify reset token is valid
     */
    @GetMapping("/verify")
    public ResponseEntity<Map<String, String>> verifyResetToken(@RequestParam String token) {
        passwordResetService.verifyResetToken(token);
        return ResponseEntity.ok(Map.of(
            "message", "Token is valid"
        ));
    }
    
    /**
     * Reset password using token
     */
    @PostMapping("/confirm")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody PasswordResetConfirmRequest request) {
        passwordResetService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok(Map.of(
            "message", "Password has been reset successfully. You can now login with your new password."
        ));
    }
}
