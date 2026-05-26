package com.capstone.mbservices.config;

import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Rate limiting filter to prevent brute force attacks
 * Applied to authentication endpoints
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {
    
    private final RateLimitConfig rateLimitConfig;
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) 
            throws ServletException, IOException {
        
        String path = request.getRequestURI();
        
        // Apply strict rate limiting to auth endpoints
        if (isAuthEndpoint(path)) {
            String key = getClientIP(request);
            Bucket bucket = rateLimitConfig.resolveBucket(key);
            ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
            
            if (probe.isConsumed()) {
                response.addHeader("X-Rate-Limit-Remaining", String.valueOf(probe.getRemainingTokens()));
                filterChain.doFilter(request, response);
            } else {
                long waitForRefill = probe.getNanosToWaitForRefill() / 1_000_000_000;
                response.setStatus(429);
                response.addHeader("X-Rate-Limit-Retry-After-Seconds", String.valueOf(waitForRefill));
                response.getWriter().write("{\"error\":\"Too many requests. Please try again later.\"}");
                log.warn("Rate limit exceeded for IP: {} on path: {}", key, path);
            }
        } else {
            filterChain.doFilter(request, response);
        }
    }
    
    private boolean isAuthEndpoint(String path) {
        return path.contains("/auth/login") || 
               path.contains("/auth/register") ||
               path.contains("/auth/oauth");
    }
    
    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }
}
