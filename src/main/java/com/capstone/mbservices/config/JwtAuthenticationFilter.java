package com.capstone.mbservices.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import com.capstone.mbservices.entity.User;
import com.capstone.mbservices.repository.UserRepository;
import com.capstone.mbservices.service.JwtService;
import java.io.IOException;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    private final JwtService jwtService;
    private final UserRepository userRepository;
    
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        // Skip JWT validation for public endpoints - NO /api prefix
        if (isPublicEndpoint(request)) {
            log.debug("Public endpoint accessed: {}", path);
            filterChain.doFilter(request, response);
            return;
        }
        
        final String authHeader = request.getHeader("Authorization");
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.debug("No valid Authorization header for: {}", path);
            filterChain.doFilter(request, response);
            return;
        }
        
        try {
            final String jwt = authHeader.substring(7);
            final String userId = jwtService.extractUserId(jwt);
            
            if (userId != null) {
                User user = userRepository.findById(userId).orElse(null);
                
                if (user != null && jwtService.validateToken(jwt, user)) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        user,
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    log.debug("User authenticated: {} authorities: {}", user.getEmail(), authToken.getAuthorities());
                }
            }
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            log.warn("JWT expired: {}", e.getMessage());
        } catch (io.jsonwebtoken.security.SignatureException | io.jsonwebtoken.MalformedJwtException | io.jsonwebtoken.UnsupportedJwtException e) {
            log.warn("Invalid JWT: {}", e.getMessage());
        } catch (Exception e) {
            log.error("JWT validation error: {}", e.getMessage());
        }
        
        filterChain.doFilter(request, response);
    }
    
    /**
     * Check if endpoint is public - paths WITHOUT /api prefix
     * (context-path adds /api automatically)
     */
    private boolean isPublicEndpoint(HttpServletRequest request) {
        String path = request.getRequestURI();
        String method = request.getMethod();
        if (path.startsWith("/v3/api-docs") ||
            path.startsWith("/swagger-ui") ||
            path.startsWith("/api/auth/") ||
            path.startsWith("/api/ws") ||
            path.startsWith("/ws") ||
            path.startsWith("/api/reviews/motorcycle/") ||
            path.equals("/api/reviews/approved") ||
            path.equals("/api/bookings/services/stats") ||
            path.startsWith("/api/bookings/services/recent") ||
            path.startsWith("/api/bookings/services/catalog") ||
            path.equals("/api/bookings/stores") ||
            path.startsWith("/api/bookings/stores/nearest") ||
            path.startsWith("/api/discount-codes/validate/") ||
            path.startsWith("/auth/") ||
            path.startsWith("/reviews/motorcycle/") ||
            path.equals("/reviews/approved") ||
            path.equals("/bookings/services/stats") ||
            path.startsWith("/bookings/services/recent") ||
            path.startsWith("/bookings/services/catalog") ||
            path.equals("/bookings/stores") ||
            path.startsWith("/discount-codes/validate/") ||
            path.startsWith("/bookings/stores/nearest")) {
            return true;
        }
        if ((path.startsWith("/api/motorcycles/") || path.startsWith("/motorcycles/")) && "GET".equalsIgnoreCase(method)) {
            return true;
        }
        if ((path.startsWith("/api/forum/") || path.startsWith("/forum/")) && "GET".equalsIgnoreCase(method)) {
            return true;
        }
        return false;
    }
}
