package com.capstone.mbservices.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.capstone.mbservices.dto.request.LoginRequest;
import com.capstone.mbservices.dto.request.RegisterRequest;
import com.capstone.mbservices.dto.response.AuthResponse;
import com.capstone.mbservices.entity.User;
import com.capstone.mbservices.enums.UserRole;
import com.capstone.mbservices.exception.BadRequestException;
import com.capstone.mbservices.repository.UserRepository;

import com.capstone.mbservices.service.OAuthTokenVerifierService.GoogleUserInfo;
import com.capstone.mbservices.service.OAuthTokenVerifierService.FacebookUserInfo;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final OAuthTokenVerifierService oauthVerifier;

    private static final String PLACEHOLDER_EMAIL_DOMAIN = "@mbservices.local";
    
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already exists");
        }
        
        User user = User.builder()
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .firstname(request.getFirstname())
            .lastname(request.getLastname())
            .phone(request.getPhone())
            .address(request.getAddress())
            .authProvider("LOCAL")
            .hasLocalCredentials(true)
            .role(UserRole.CUSTOMER)
            .isActive(true)
            .build();
        
        user = userRepository.save(user);
        String token = jwtService.generateToken(user);
        
        return AuthResponse.builder()
            .token(token)
            .id(user.getId())
            .email(user.getEmail())
            .username(user.getUsername())
            .authProvider(user.getAuthProvider())
            .hasLocalCredentials(user.getHasLocalCredentials())
            .firstname(user.getFirstname())
            .lastname(user.getLastname())
            .phone(user.getPhone())
            .address(user.getAddress())
            .role(user.getRole().name())
            .build();
    }
    
    public AuthResponse login(LoginRequest request) {
        String identifier = request.getIdentifier();
        if (identifier == null || identifier.isBlank()) {
            throw new BadRequestException("Email or username is required");
        }
        
        User user = userRepository.findByEmail(identifier)
            .or(() -> userRepository.findByUsername(identifier))
            .orElseThrow(() -> new BadRequestException("Invalid email/username or password"));
        
        boolean changed = false;
        if (user.getAuthProvider() == null || user.getAuthProvider().isBlank()) {
            user.setAuthProvider("LOCAL");
            changed = true;
        }
        if (user.getHasLocalCredentials() == null) {
            user.setHasLocalCredentials(true);
            changed = true;
        }
        if (changed) {
            userRepository.save(user);
        }

        if (user.getPassword() == null || user.getPassword().isBlank()) {
            throw new BadRequestException("This account uses social sign-in. Please sign in with Google or Facebook, or set a password in your profile.");
        }
        
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadRequestException("Invalid email/username or password");
        }
        
        if (!user.getIsActive()) {
            throw new BadRequestException("Account is inactive");
        }
        
        String token = jwtService.generateToken(user);
        
        return AuthResponse.builder()
            .token(token)
            .id(user.getId())
            .email(user.getEmail())
            .username(user.getUsername())
            .authProvider(user.getAuthProvider())
            .hasLocalCredentials(user.getHasLocalCredentials())
            .firstname(user.getFirstname())
            .lastname(user.getLastname())
            .phone(user.getPhone())
            .address(user.getAddress())
            .role(user.getRole().name())
            .build();
    }
    
    public AuthResponse registerWithUsername(String username, String password) {
        if (username == null || username.isBlank()) {
            throw new BadRequestException("Username is required");
        }
        String normalized = username.trim();
        if (!normalized.matches("^[a-zA-Z0-9_]{3,20}$")) {
            throw new BadRequestException("Username must be 3-20 characters and contain only letters, numbers, underscore");
        }
        if (userRepository.existsByUsername(normalized)) {
            throw new BadRequestException("Username already exists");
        }
        if (password == null || password.length() < 8) {
            throw new BadRequestException("Password must be at least 8 characters");
        }
        if (!password.matches("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$")) {
            throw new BadRequestException("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)");
        }
        String placeholderEmail = normalized.toLowerCase() + PLACEHOLDER_EMAIL_DOMAIN;
        if (userRepository.existsByEmail(placeholderEmail)) {
            throw new BadRequestException("Username is not available");
        }
        
        User user = User.builder()
            .email(placeholderEmail)
            .username(normalized)
            .password(passwordEncoder.encode(password))
            .firstname("User")
            .lastname("")
            .authProvider("LOCAL")
            .hasLocalCredentials(true)
            .role(UserRole.CUSTOMER)
            .isActive(true)
            .build();
        
        user = userRepository.save(user);
        String token = jwtService.generateToken(user);
        
        return AuthResponse.builder()
            .token(token)
            .id(user.getId())
            .email(user.getEmail())
            .username(user.getUsername())
            .authProvider(user.getAuthProvider())
            .hasLocalCredentials(user.getHasLocalCredentials())
            .firstname(user.getFirstname())
            .lastname(user.getLastname())
            .phone(user.getPhone())
            .address(user.getAddress())
            .role(user.getRole().name())
            .build();
    }

    public AuthResponse loginWithGoogle(String idToken) {
        GoogleUserInfo googleUser = oauthVerifier.verifyGoogleToken(idToken);
        
        String[] initialNames = parseNames(googleUser.firstName(), googleUser.lastName(), googleUser.fullName());
        
        User user = userRepository.findByEmail(googleUser.email())
            .orElseGet(() -> {
                User newUser = User.builder()
                    .email(googleUser.email())
                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .firstname(initialNames[0])
                    .lastname(initialNames[1])
                    .authProvider("GOOGLE")
                    .hasLocalCredentials(false)
                    .role(UserRole.CUSTOMER)
                    .isActive(true)
                    .build();
                return userRepository.save(newUser);
            });
        
        // Auto-repair old corrupted name profiles or missing names
        if (user.getFirstname() == null || user.getFirstname().contains("?") || user.getLastname() == null || user.getLastname().contains("?")) {
            String[] repairedNames = parseNames(googleUser.firstName(), googleUser.lastName(), googleUser.fullName());
            user.setFirstname(repairedNames[0]);
            user.setLastname(repairedNames[1]);
            user = userRepository.save(user);
        }
        
        if (user.getAuthProvider() == null || user.getAuthProvider().isBlank() || user.getHasLocalCredentials() == null) {
            if (user.getAuthProvider() == null || user.getAuthProvider().isBlank()) {
                user.setAuthProvider("GOOGLE");
            }
            if (user.getHasLocalCredentials() == null) {
                user.setHasLocalCredentials(false);
            }
            userRepository.save(user);
        }
            
        if (!user.getIsActive()) {
            throw new BadRequestException("Account is inactive");
        }
        
        String token = jwtService.generateToken(user);
        return AuthResponse.builder()
            .token(token)
            .id(user.getId())
            .email(user.getEmail())
            .username(user.getUsername())
            .authProvider(user.getAuthProvider())
            .hasLocalCredentials(user.getHasLocalCredentials())
            .firstname(user.getFirstname())
            .lastname(user.getLastname())
            .phone(user.getPhone())
            .address(user.getAddress())
            .role(user.getRole().name())
            .build();
    }

    public AuthResponse loginWithFacebook(String accessToken) {
        FacebookUserInfo fbUser = oauthVerifier.verifyFacebookToken(accessToken);
        
        String[] initialNames = parseNames(fbUser.firstName(), fbUser.lastName(), fbUser.fullName());
        
        User user = userRepository.findByEmail(fbUser.email())
            .orElseGet(() -> {
                User newUser = User.builder()
                    .email(fbUser.email())
                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .firstname(initialNames[0])
                    .lastname(initialNames[1])
                    .authProvider("FACEBOOK")
                    .hasLocalCredentials(false)
                    .role(UserRole.CUSTOMER)
                    .isActive(true)
                    .build();
                return userRepository.save(newUser);
            });
        
        // Auto-repair old corrupted name profiles or missing names
        if (user.getFirstname() == null || user.getFirstname().contains("?") || user.getLastname() == null || user.getLastname().contains("?")) {
            String[] repairedNames = parseNames(fbUser.firstName(), fbUser.lastName(), fbUser.fullName());
            user.setFirstname(repairedNames[0]);
            user.setLastname(repairedNames[1]);
            user = userRepository.save(user);
        }
        
        if (user.getAuthProvider() == null || user.getAuthProvider().isBlank() || user.getHasLocalCredentials() == null) {
            if (user.getAuthProvider() == null || user.getAuthProvider().isBlank()) {
                user.setAuthProvider("FACEBOOK");
            }
            if (user.getHasLocalCredentials() == null) {
                user.setHasLocalCredentials(false);
            }
            userRepository.save(user);
        }
            
        if (!user.getIsActive()) {
            throw new BadRequestException("Account is inactive");
        }
        
        String token = jwtService.generateToken(user);
        return AuthResponse.builder()
            .token(token)
            .id(user.getId())
            .email(user.getEmail())
            .username(user.getUsername())
            .authProvider(user.getAuthProvider())
            .hasLocalCredentials(user.getHasLocalCredentials())
            .firstname(user.getFirstname())
            .lastname(user.getLastname())
            .phone(user.getPhone())
            .address(user.getAddress())
            .role(user.getRole().name())
            .build();
    }

    private String[] parseNames(String firstName, String lastName, String fullName) {
        String resFirstName = firstName;
        String resLastName = lastName;
        
        // If either first name or last name contains '?' or is null/empty, we try to reconstruct using fullName
        boolean needsReconstruction = (resFirstName == null || resFirstName.trim().isEmpty() || resFirstName.contains("?")) ||
                                     (resLastName == null || resLastName.contains("?"));
                                     
        if (needsReconstruction && fullName != null && !fullName.trim().isEmpty() && !fullName.contains("?")) {
            String cleanName = fullName.trim();
            int lastSpaceIdx = cleanName.lastIndexOf(' ');
            if (lastSpaceIdx > 0) {
                // Vietnamese order: "Phạm Minh Tuấn"
                // First name (Tên) is "Tuấn", Last name (Họ & Tên đệm) is "Phạm Minh"
                resFirstName = cleanName.substring(lastSpaceIdx + 1);
                resLastName = cleanName.substring(0, lastSpaceIdx);
            } else {
                resFirstName = cleanName;
                resLastName = "";
            }
        }
        
        // Fallback checks
        if (resFirstName == null || resFirstName.trim().isEmpty()) {
            resFirstName = "User";
        }
        if (resLastName == null) {
            resLastName = "";
        }
        
        return new String[]{resFirstName, resLastName};
    }
}
