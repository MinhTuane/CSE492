package com.capstone.mbservices.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.capstone.mbservices.entity.Review;
import com.capstone.mbservices.dto.request.ReviewRequest;
import com.capstone.mbservices.service.ReviewService;
import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/reviews")  // NO /api prefix!
@RequiredArgsConstructor
public class ReviewController {
    private final ReviewService reviewService;
    
    @PostMapping
    @PreAuthorize("#request.userId == authentication.principal.id or hasAnyRole('ADMIN', 'SUPER_ADMIN', 'BRANCH_MANAGER')")
    public ResponseEntity<Review> create(@Valid @RequestBody ReviewRequest request) {
        return ResponseEntity.ok(reviewService.createReview(request));
    }
    
    @GetMapping("/motorcycle/{motorcycleId}")
    public ResponseEntity<List<Review>> getMotorcycleReviews(@PathVariable String motorcycleId) {
        return ResponseEntity.ok(reviewService.getMotorcycleReviews(motorcycleId));
    }
    
    @GetMapping("/approved")
    public ResponseEntity<List<Review>> getApprovedReviews() {
        return ResponseEntity.ok(reviewService.getApprovedReviews());
    }
    
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'BRANCH_MANAGER', 'STAFF', 'SALES_STAFF', 'SERVICE_ADVISOR')")
    public ResponseEntity<Review> approve(@PathVariable String id) {
        return ResponseEntity.ok(reviewService.approveReview(id));
    }
    
    @PutMapping("/{id}/flag")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<Review> flag(@PathVariable String id) {
        return ResponseEntity.ok(reviewService.flagReview(id));
    }
}
