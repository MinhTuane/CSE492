package com.capstone.mbservices.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpMethod;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true, securedEnabled = true)
public class SecurityConfig {

    @Value("${app.cors.allowed-origin-patterns:http://localhost:*,http://127.0.0.1:*}")
    private String corsOriginPatterns;
    
    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtAuthenticationFilter jwtAuthFilter) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // Stateless JWT API - CSRF not needed
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints - NO /api prefix (context-path adds it automatically)
                .requestMatchers(
                    "/v3/api-docs/**",
                    "/swagger-ui/**",
                    "/swagger-ui.html",
                    "/error",
                    "/auth/**",
                    "/reviews/motorcycle/**",
                    "/reviews/approved",
                    "/bookings/services/catalog",
                    "/bookings/stores",
                    "/bookings/stores/nearest",
                    "/orders/momo-ipn",
                    "/orders/vnpay-ipn",
                    "/vnpay/**",
                    "/chatbot/ask",
                    "/chat/**",
                    "/inventory/motorcycle/**",
                    "/inventory/store/**",
                    "/ws/**",
                    "/discount-codes/validate/**",
                    "/users/check-email",
                    "/users/check-username",
                    "/comparison/**"
                ).permitAll()
                .requestMatchers("/images/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/motorcycles/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/accessories/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/forum/**").permitAll()
                
                .requestMatchers("/admin/**").hasAnyRole("ADMIN", "SUPER_ADMIN", "BRANCH_MANAGER", "SALES_STAFF", "SERVICE_ADVISOR")
                .requestMatchers("/staff/**").hasAnyRole("STAFF", "ADMIN", "SUPER_ADMIN", "BRANCH_MANAGER", "SALES_STAFF", "SERVICE_ADVISOR")
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\": \"Unauthorized\", \"message\": \"" + authException.getMessage() + "\"}");
                })
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(rateLimitFilter(), jwtAuthFilter.getClass());
        
        return http.build();
    }
    
    @Bean
    public RateLimitFilter rateLimitFilter() {
        return new RateLimitFilter(new RateLimitConfig());
    }
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> patterns = Arrays.stream(corsOriginPatterns.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
        if (patterns.isEmpty()) {
            patterns = List.of("http://localhost:*");
        }
        configuration.setAllowedOriginPatterns(patterns);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setExposedHeaders(Arrays.asList("Authorization"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
