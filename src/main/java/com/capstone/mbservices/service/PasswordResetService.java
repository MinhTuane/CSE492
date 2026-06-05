package com.capstone.mbservices.service;

import com.capstone.mbservices.entity.PasswordResetToken;
import com.capstone.mbservices.entity.User;
import com.capstone.mbservices.exception.BadRequestException;
import com.capstone.mbservices.exception.ResourceNotFoundException;
import com.capstone.mbservices.repository.PasswordResetTokenRepository;
import com.capstone.mbservices.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetService {
    
    private final PasswordResetTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    
    private static final String PLACEHOLDER_EMAIL_DOMAIN = "@mbservices.local";
    
    /**
     * Request password reset - sends email with reset link
     */
    @Transactional
    public void requestPasswordReset(String email) {
        // Check if email is a placeholder (username-based account)
        if (email.endsWith(PLACEHOLDER_EMAIL_DOMAIN)) {
            throw new BadRequestException("Password reset is not available for username-based accounts. Please contact support.");
        }
        
        java.util.Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            log.info("Password reset requested for non-existent email: {}", email);
            return;
        }
        User user = userOpt.get();
        
        // Check if user has local credentials
        if (!Boolean.TRUE.equals(user.getHasLocalCredentials())) {
            throw new BadRequestException("This account uses social sign-in. Please sign in with " + user.getAuthProvider());
        }
        
        // Delete any existing unused tokens for this user
        tokenRepository.deleteByUser(user);
        
        // Generate new token
        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = PasswordResetToken.builder()
            .token(token)
            .user(user)
            .expiryDate(LocalDateTime.now().plusHours(1))
            .used(false)
            .build();
        
        tokenRepository.save(resetToken);
        
        // Send email with reset link
        emailService.sendPasswordResetEmail(user.getEmail(), token);
        
        log.info("Password reset requested for user: {}", email);
    }
    
    /**
     * Verify reset token is valid
     */
    public void verifyResetToken(String token) {
        PasswordResetToken resetToken = tokenRepository.findByToken(token)
            .orElseThrow(() -> new BadRequestException("Invalid or expired reset token"));
        
        if (resetToken.getUsed()) {
            throw new BadRequestException("This reset token has already been used");
        }
        
        if (resetToken.isExpired()) {
            throw new BadRequestException("This reset token has expired. Please request a new one.");
        }
    }
    
    /**
     * Reset password using token
     */
    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = tokenRepository.findByToken(token)
            .orElseThrow(() -> new BadRequestException("Invalid or expired reset token"));
        
        if (resetToken.getUsed()) {
            throw new BadRequestException("This reset token has already been used");
        }
        
        if (resetToken.isExpired()) {
            throw new BadRequestException("This reset token has expired. Please request a new one.");
        }
        
        User user = resetToken.getUser();
        
        // Update password
        user.setPassword(passwordEncoder.encode(newPassword));
        
        // Ensure user has local credentials flag set
        if (!Boolean.TRUE.equals(user.getHasLocalCredentials())) {
            user.setHasLocalCredentials(true);
        }
        
        userRepository.save(user);
        
        // Mark token as used
        resetToken.setUsed(true);
        tokenRepository.save(resetToken);
        
        log.info("Password reset successful for user: {}", user.getEmail());
    }
    
    /**
     * Clean up expired tokens - runs daily at 2 AM
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void cleanupExpiredTokens() {
        LocalDateTime now = LocalDateTime.now();
        tokenRepository.deleteByExpiryDateBefore(now);
        log.info("Cleaned up expired password reset tokens");
    }
}
