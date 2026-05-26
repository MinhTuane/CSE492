package com.capstone.mbservices.service;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import com.capstone.mbservices.entity.User;
import java.security.Key;
import java.util.*;

@Service
public class JwtService {
    
    @Value("${jwt.secret}")
    private String secretKey;
    
    @Value("${jwt.expiration}")
    private long jwtExpiration;
    
    private Key getSigningKey() {
        byte[] keyBytes = secretKey.getBytes();
        return Keys.hmacShaKeyFor(keyBytes);
    }
    
    public String generateToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", user.getRole().name());
        claims.put("email", user.getEmail());
        claims.put("name", user.getFirstname() + " " + user.getLastname());
        
        return Jwts.builder()
            .setClaims(claims)
            .setSubject(user.getId())
            .setIssuedAt(new Date(System.currentTimeMillis()))
            .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
            .signWith(getSigningKey(), SignatureAlgorithm.HS256)
            .compact();
    }
    
    public String extractUserId(String token) {
        return extractAllClaims(token).getSubject();
    }
    
    public String extractEmail(String token) {
        return extractAllClaims(token).get("email", String.class);
    }
    
    public Date extractExpiration(String token) {
        return extractAllClaims(token).getExpiration();
    }
    
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
            .setSigningKey(getSigningKey())
            .build()
            .parseClaimsJws(token)
            .getBody();
    }
    
    public Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }
    
    public Boolean validateToken(String token, User user) {
        final String userId = extractUserId(token);
        return (userId.equals(user.getId()) && !isTokenExpired(token));
    }
}
