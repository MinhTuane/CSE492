package com.capstone.mbservices.dto.response;

import com.capstone.mbservices.entity.User;
import com.capstone.mbservices.enums.MembershipTier;
import com.capstone.mbservices.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Safe DTO for exposing user profile info to API clients.
 * Excludes password, internal flags, and lazy-loaded relations.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private String id;
    private String email;
    private String username;
    private String firstname;
    private String lastname;
    private String phone;
    private String address;
    private UserRole role;
    private Boolean isActive;
    private Integer loyaltyPoints;
    private MembershipTier membershipTier;
    private String authProvider;
    private Boolean hasLocalCredentials;
    private LocalDateTime createAt;
    private LocalDateTime updateAt;

    public static UserProfileResponse from(User user) {
        if (user == null) return null;
        return UserProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .firstname(user.getFirstname())
                .lastname(user.getLastname())
                .phone(user.getPhone())
                .address(user.getAddress())
                .role(user.getRole())
                .isActive(user.getIsActive())
                .loyaltyPoints(user.getLoyaltyPoints())
                .membershipTier(user.getMembershipTier())
                .authProvider(user.getAuthProvider())
                .hasLocalCredentials(user.getHasLocalCredentials())
                .createAt(user.getCreateAt())
                .updateAt(user.getUpdateAt())
                .build();
    }
}
