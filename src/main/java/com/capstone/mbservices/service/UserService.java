package com.capstone.mbservices.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.capstone.mbservices.entity.User;
import com.capstone.mbservices.exception.BadRequestException;
import com.capstone.mbservices.exception.ResourceNotFoundException;
import com.capstone.mbservices.repository.UserRepository;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    private static final String PLACEHOLDER_EMAIL_DOMAIN = "@mbservices.local";
    
    /**
     * Get user profile by ID
     */
    public User getUserProfile(String userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
    
    /**
     * Update user profile information
     */
    public User updateProfile(String userId, Map<String, String> updates) {
        User user = getUserProfile(userId);
        
        // Update allowed fields
        if (updates.containsKey("firstname")) {
            user.setFirstname(updates.get("firstname"));
        }
        if (updates.containsKey("lastname")) {
            user.setLastname(updates.get("lastname"));
        }
        if (updates.containsKey("phone")) {
            String phone = updates.get("phone");
            if (phone != null && !phone.matches("^[0-9]{10,11}$")) {
                throw new BadRequestException("Invalid phone number format");
            }
            user.setPhone(phone);
        }
        if (updates.containsKey("address")) {
            user.setAddress(updates.get("address"));
        }
        
        return userRepository.save(user);
    }
    
    /**
     * Change user password
     */
    public void changePassword(String userId, String oldPassword, String newPassword) {
        User user = getUserProfile(userId);
        
        // Verify old password
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }
        
        // Validate new password
        if (newPassword == null || newPassword.length() < 6) {
            throw new BadRequestException("New password must be at least 6 characters");
        }
        
        // Update password
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
    
    /**
     * Update email address
     */
    public User updateEmail(String userId, String newEmail, String password) {
        User user = getUserProfile(userId);
        
        // Verify password
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new BadRequestException("Password is incorrect");
        }
        
        // Validate email format
        if (newEmail == null || !newEmail.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new BadRequestException("Invalid email format");
        }
        
        // Check if email already exists
        if (userRepository.existsByEmail(newEmail) && !newEmail.equals(user.getEmail())) {
            throw new BadRequestException("Email already in use");
        }
        
        user.setEmail(newEmail);
        return userRepository.save(user);
    }
    
    public User setUsername(String userId, String username, String password) {
        User user = getUserProfile(userId);
        
        if (username == null || username.isBlank()) {
            throw new BadRequestException("Username is required");
        }
        String normalized = username.trim();
        if (!normalized.matches("^[a-zA-Z0-9_]{3,20}$")) {
            throw new BadRequestException("Username must be 3-20 characters and contain only letters, numbers, underscore");
        }
        
        User existing = userRepository.findByUsername(normalized).orElse(null);
        if (existing != null && !existing.getId().equals(user.getId())) {
            throw new BadRequestException("Username already in use");
        }
        
        String provider = user.getAuthProvider() != null ? user.getAuthProvider() : "LOCAL";
        if ("LOCAL".equalsIgnoreCase(provider)) {
            if (password == null || password.isBlank()) {
                throw new BadRequestException("Password is required");
            }
            if (!passwordEncoder.matches(password, user.getPassword())) {
                throw new BadRequestException("Password is incorrect");
            }
        }
        
        user.setUsername(normalized);
        return userRepository.save(user);
    }
    
    public void setPassword(String userId, String oldPassword, String newPassword) {
        User user = getUserProfile(userId);
        
        if (newPassword == null || newPassword.length() < 6) {
            throw new BadRequestException("New password must be at least 6 characters");
        }
        
        String provider = user.getAuthProvider() != null ? user.getAuthProvider() : "LOCAL";
        if ("LOCAL".equalsIgnoreCase(provider)) {
            if (oldPassword == null || oldPassword.isBlank()) {
                throw new BadRequestException("Current password is required");
            }
            if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
                throw new BadRequestException("Current password is incorrect");
            }
        }
        
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setHasLocalCredentials(true);
        userRepository.save(user);
    }
    
    public boolean isUsernameAvailable(String username, String currentUserId) {
        if (username == null || username.isBlank()) return false;
        User existingUser = userRepository.findByUsername(username).orElse(null);
        if (existingUser == null) return true;
        return existingUser.getId().equals(currentUserId);
    }
    
    public boolean isEmailPlaceholder(String email) {
        return email != null && email.endsWith(PLACEHOLDER_EMAIL_DOMAIN);
    }
    
    /**
     * Get user statistics (orders, bookings, reviews count)
     */
    public Map<String, Object> getUserStats(String userId) {
        User user = getUserProfile(userId);
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalOrders", user.getOrders() != null ? user.getOrders().size() : 0);
        stats.put("totalTestRides", user.getTestRides() != null ? user.getTestRides().size() : 0);
        stats.put("totalServices", user.getServices() != null ? user.getServices().size() : 0);
        stats.put("totalReviews", user.getReviews() != null ? user.getReviews().size() : 0);
        stats.put("memberSince", user.getCreateAt());
        stats.put("isActive", user.getIsActive());
        stats.put("role", user.getRole().name());
        
        return stats;
    }
    
    /**
     * Deactivate user account (soft delete)
     */
    public void deactivateAccount(String userId, String password) {
        User user = getUserProfile(userId);
        
        // Verify password
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new BadRequestException("Password is incorrect");
        }
        
        user.setIsActive(false);
        userRepository.save(user);
    }
    
    /**
     * Reactivate user account
     */
    public User reactivateAccount(String userId) {
        User user = getUserProfile(userId);
        user.setIsActive(true);
        return userRepository.save(user);
    }
    
    /**
     * Check if email is available
     */
    public boolean isEmailAvailable(String email, String currentUserId) {
        User existingUser = userRepository.findByEmail(email).orElse(null);
        
        if (existingUser == null) {
            return true;
        }
        
        // Email is available if it belongs to the current user
        return existingUser.getId().equals(currentUserId);
    }
    
    /**
     * Get user's full name
     */
    public String getUserFullName(String userId) {
        User user = getUserProfile(userId);
        return user.getFirstname() + " " + user.getLastname();
    }
    
    /**
     * Update user's last active timestamp (could be called on each login)
     */
    public void updateLastActive(String userId) {
        User user = getUserProfile(userId);
        // If you add a lastActiveAt field to User entity, update it here
        userRepository.save(user);
    }
}
