package com.capstone.mbservices.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate limiting configuration using Bucket4j
 * Prevents brute force attacks on authentication endpoints
 */
@Configuration
public class RateLimitConfig {
    
    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();
    
    /**
     * Get or create a rate limit bucket for an IP address
     * Allows 5 requests per minute for login/register endpoints
     */
    public Bucket resolveBucket(String key) {
        return cache.computeIfAbsent(key, k -> createNewBucket());
    }
    
    private Bucket createNewBucket() {
        // Allow 5 requests per minute
        Bandwidth limit = Bandwidth.classic(5, Refill.intervally(5, Duration.ofMinutes(1)));
        return Bucket.builder()
            .addLimit(limit)
            .build();
    }
    
    /**
     * More lenient rate limit for general API calls
     * Allows 100 requests per minute
     */
    public Bucket resolveGeneralBucket(String key) {
        return cache.computeIfAbsent("general_" + key, k -> createGeneralBucket());
    }
    
    private Bucket createGeneralBucket() {
        Bandwidth limit = Bandwidth.classic(100, Refill.intervally(100, Duration.ofMinutes(1)));
        return Bucket.builder()
            .addLimit(limit)
            .build();
    }
}
