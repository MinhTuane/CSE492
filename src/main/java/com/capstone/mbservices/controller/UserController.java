package com.capstone.mbservices.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.capstone.mbservices.entity.User;
import com.capstone.mbservices.dto.response.UserProfileResponse;
import com.capstone.mbservices.service.UserService;
import java.util.Map;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {
    
    private final UserService userService;
    
    /**
     * Get current user's profile
     * GET /api/users/profile/{userId}
     */
    @GetMapping("/profile/{userId}")
    @PreAuthorize("#userId == authentication.principal.id or hasRole('ADMIN')")
    public ResponseEntity<UserProfileResponse> getUserProfile(@PathVariable String userId) {
        User user = userService.getUserProfile(userId);
        return ResponseEntity.ok(UserProfileResponse.from(user));
    }
    
    /**
     * Update user profile
     * PUT /api/users/profile/{userId}
     * Body: {
     *   "firstname": "John",
     *   "lastname": "Doe",
     *   "phone": "0123456789",
     *   "address": "123 Street"
     * }
     */
    @PutMapping("/profile/{userId}")
    @PreAuthorize("#userId == authentication.principal.id or hasRole('ADMIN')")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @PathVariable String userId,
            @RequestBody Map<String, String> updates) {
        
        User updatedUser = userService.updateProfile(userId, updates);
        return ResponseEntity.ok(UserProfileResponse.from(updatedUser));
    }
    
    /**
     * Change password
     * POST /api/users/{userId}/change-password
     * Body: {
     *   "oldPassword": "current123",
     *   "newPassword": "newpass123"
     * }
     */
    @PostMapping("/{userId}/change-password")
    @PreAuthorize("#userId == authentication.principal.id or hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> changePassword(
            @PathVariable String userId,
            @RequestBody Map<String, String> passwordData) {
        
        String oldPassword = passwordData.get("oldPassword");
        String newPassword = passwordData.get("newPassword");
        
        userService.changePassword(userId, oldPassword, newPassword);
        
        return ResponseEntity.ok(Map.of(
            "message", "Password changed successfully"
        ));
    }
    
    /**
     * Update email address
     * POST /api/users/{userId}/update-email
     * Body: {
     *   "newEmail": "newemail@example.com",
     *   "password": "current123"
     * }
     */
    @PostMapping("/{userId}/update-email")
    @PreAuthorize("#userId == authentication.principal.id or hasRole('ADMIN')")
    public ResponseEntity<UserProfileResponse> updateEmail(
            @PathVariable String userId,
            @RequestBody Map<String, String> emailData) {
        
        String newEmail = emailData.get("newEmail");
        String password = emailData.get("password");
        
        User updatedUser = userService.updateEmail(userId, newEmail, password);
        return ResponseEntity.ok(UserProfileResponse.from(updatedUser));
    }
    
    @PostMapping("/{userId}/username")
    @PreAuthorize("#userId == authentication.principal.id or hasRole('ADMIN')")
    public ResponseEntity<UserProfileResponse> setUsername(
            @PathVariable String userId,
            @RequestBody Map<String, String> data) {
        String username = data.get("username");
        String password = data.get("password");
        return ResponseEntity.ok(UserProfileResponse.from(userService.setUsername(userId, username, password)));
    }
    
    @PostMapping("/{userId}/set-password")
    @PreAuthorize("#userId == authentication.principal.id or hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> setPassword(
            @PathVariable String userId,
            @RequestBody Map<String, String> data) {
        String oldPassword = data.get("oldPassword");
        String newPassword = data.get("newPassword");
        userService.setPassword(userId, oldPassword, newPassword);
        return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
    }
    
    /**
     * Get user statistics
     * GET /api/users/{userId}/stats
     * 
     * Returns order count, booking count, review count, etc.
     */
    @GetMapping("/{userId}/stats")
    @PreAuthorize("#userId == authentication.principal.id or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getUserStats(@PathVariable String userId) {
        Map<String, Object> stats = userService.getUserStats(userId);
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Deactivate account
     * POST /api/users/{userId}/deactivate
     * Body: {
     *   "password": "current123"
     * }
     */
    @PostMapping("/{userId}/deactivate")
    @PreAuthorize("#userId == authentication.principal.id or hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deactivateAccount(
            @PathVariable String userId,
            @RequestBody Map<String, String> data) {
        
        String password = data.get("password");
        userService.deactivateAccount(userId, password);
        
        return ResponseEntity.ok(Map.of(
            "message", "Account deactivated successfully"
        ));
    }
    
    /**
     * Reactivate account (Admin only)
     * POST /api/users/{userId}/reactivate
     */
    @PostMapping("/{userId}/reactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserProfileResponse> reactivateAccount(@PathVariable String userId) {
        User user = userService.reactivateAccount(userId);
        return ResponseEntity.ok(UserProfileResponse.from(user));
    }
    
    /**
     * Check if email is available
     * GET /api/users/check-email?email=test@example.com&userId=abc123
     */
    @GetMapping("/check-email")
    public ResponseEntity<Map<String, Boolean>> checkEmailAvailability(
            @RequestParam String email,
            @RequestParam(required = false) String userId) {
        
        boolean available = userService.isEmailAvailable(email, userId);
        
        return ResponseEntity.ok(Map.of(
            "available", available
        ));
    }
    
    @GetMapping("/check-username")
    public ResponseEntity<Map<String, Boolean>> checkUsernameAvailability(
            @RequestParam String username,
            @RequestParam(required = false) String userId) {
        boolean available = userService.isUsernameAvailable(username, userId);
        return ResponseEntity.ok(Map.of("available", available));
    }
    
    /**
     * Get user's full name
     * GET /api/users/{userId}/full-name
     */
    @GetMapping("/{userId}/full-name")
    public ResponseEntity<Map<String, String>> getUserFullName(@PathVariable String userId) {
        String fullName = userService.getUserFullName(userId);
        
        return ResponseEntity.ok(Map.of(
            "fullName", fullName
        ));
    }
}
