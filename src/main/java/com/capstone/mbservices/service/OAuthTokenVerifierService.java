package com.capstone.mbservices.service;

import com.capstone.mbservices.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
@Slf4j
public class OAuthTokenVerifierService {

    @Value("${google.client.id:}")
    private String googleClientId;

    @Value("${facebook.app.id:}")
    private String facebookAppId;

    @Value("${facebook.app-secret:}")
    private String facebookAppSecret;

    private final RestTemplate restTemplate = new RestTemplate();
    private JwtDecoder googleJwtDecoder;

    public GoogleUserInfo verifyGoogleToken(String idToken) {
        if (googleClientId == null || googleClientId.isBlank()) {
            throw new BadRequestException("Google OAuth is not configured (missing GOOGLE_CLIENT_ID)");
        }
        if (googleJwtDecoder == null) {
            googleJwtDecoder = NimbusJwtDecoder.withJwkSetUri("https://www.googleapis.com/oauth2/v3/certs").build();
        }

        try {
            Jwt jwt = googleJwtDecoder.decode(idToken);
            
            if (!jwt.getAudience().contains(googleClientId)) {
                throw new BadRequestException("Invalid Google token audience (expected client_id=" + googleClientId + ", actual_aud=" + jwt.getAudience() + ")");
            }

            String issuer = jwt.getIssuer().toString();
            if (!"https://accounts.google.com".equals(issuer) && !"accounts.google.com".equals(issuer)) {
                throw new BadRequestException("Invalid Google token issuer");
            }

            return new GoogleUserInfo(
                jwt.getClaimAsString("email"),
                jwt.getClaimAsString("given_name"),
                jwt.getClaimAsString("family_name"),
                jwt.getClaimAsString("sub")
            );

        } catch (Exception e) {
            log.error("Google token verification failed", e);
            throw new BadRequestException("Invalid Google token: " + e.getMessage());
        }
    }

    public FacebookUserInfo verifyFacebookToken(String accessToken) {
        try {
            String debugUrl = String.format("https://graph.facebook.com/debug_token?input_token=%s&access_token=%s|%s",
                accessToken, facebookAppId, facebookAppSecret);
            
            Map<String, Object> debugResponse = restTemplate.getForObject(debugUrl, Map.class);
            if (debugResponse == null || !debugResponse.containsKey("data")) {
                throw new BadRequestException("Failed to verify Facebook token");
            }
            
            Map<String, Object> data = (Map<String, Object>) debugResponse.get("data");
            Boolean isValid = (Boolean) data.get("is_valid");
            String appId = (String) data.get("app_id");
            
            if (isValid == null || !isValid || !facebookAppId.equals(appId)) {
                throw new BadRequestException("Invalid Facebook token or app ID mismatch");
            }

            String profileUrl = String.format("https://graph.facebook.com/me?fields=id,email,first_name,last_name&access_token=%s", accessToken);
            Map<String, Object> profileResponse = restTemplate.getForObject(profileUrl, Map.class);
            
            if (profileResponse == null || !profileResponse.containsKey("id")) {
                throw new BadRequestException("Failed to fetch Facebook user profile");
            }

            String email = (String) profileResponse.get("email");
            if (email == null || email.isEmpty()) {
                throw new BadRequestException("Facebook account has no email address associated. Please allow email permission.");
            }

            return new FacebookUserInfo(
                email,
                (String) profileResponse.get("first_name"),
                (String) profileResponse.get("last_name"),
                (String) profileResponse.get("id")
            );

        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Facebook token verification failed", e);
            throw new BadRequestException("Failed to verify Facebook token: " + e.getMessage());
        }
    }

    public record GoogleUserInfo(String email, String firstName, String lastName, String googleId) {}
    public record FacebookUserInfo(String email, String firstName, String lastName, String facebookId) {}
}
