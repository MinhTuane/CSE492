package com.capstone.mbservices.controller;

import com.capstone.mbservices.entity.UserBike;
import com.capstone.mbservices.entity.User;
import com.capstone.mbservices.repository.UserBikeRepository;
import com.capstone.mbservices.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/user-bikes")
@RequiredArgsConstructor
public class UserBikeController {
    private final UserBikeRepository userBikeRepository;
    private final UserRepository userRepository;

    @GetMapping("/user/{userId}")
    @PreAuthorize("#userId == authentication.principal.id or hasAnyRole('ADMIN', 'SUPER_ADMIN', 'BRANCH_MANAGER', 'STAFF', 'SALES_STAFF', 'SERVICE_ADVISOR')")
    public ResponseEntity<List<UserBike>> getUserBikes(@PathVariable String userId) {
        return ResponseEntity.ok(userBikeRepository.findByUserIdOrderByCreateAtDesc(userId));
    }

    @PostMapping
    @PreAuthorize("#payload.get('userId') == authentication.principal.id or hasAnyRole('ADMIN', 'SUPER_ADMIN', 'BRANCH_MANAGER', 'STAFF', 'SALES_STAFF', 'SERVICE_ADVISOR')")
    public ResponseEntity<?> addBike(@RequestBody Map<String, Object> payload) {
        String userId = (String) payload.get("userId");
        User user = userRepository.findById(userId).orElseThrow();
        
        UserBike bike = UserBike.builder()
            .user(user)
            .brand((String) payload.get("brand"))
            .model((String) payload.get("model"))
            .year((Integer) payload.get("year"))
            .licensePlate((String) payload.get("licensePlate"))
            .color((String) payload.get("color"))
            .currentOdo((Integer) payload.get("currentOdo"))
            .notes((String) payload.get("notes"))
            .build();
            
        return ResponseEntity.ok(userBikeRepository.save(bike));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'BRANCH_MANAGER', 'STAFF', 'SALES_STAFF', 'SERVICE_ADVISOR') or @userBikeRepository.findById(#id).orElse(null)?.user?.id == authentication.principal.id")
    public ResponseEntity<?> removeBike(@PathVariable String id) {
        userBikeRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}