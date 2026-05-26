package com.capstone.mbservices.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.capstone.mbservices.entity.*;
import com.capstone.mbservices.dto.request.ReviewRequest;
import com.capstone.mbservices.exception.ResourceNotFoundException;
import com.capstone.mbservices.exception.BadRequestException;
import com.capstone.mbservices.repository.*;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final MotorcycleRepository motorcycleRepository;
    
    public Review createReview(ReviewRequest request) {
        if (reviewRepository.existsByUserIdAndMotorcycleId(request.getUserId(), request.getMotorcycleId())) {
            throw new BadRequestException("User has already reviewed this motorcycle");
        }
        User user = userRepository.findById(request.getUserId())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Motorcycle motorcycle = motorcycleRepository.findById(request.getMotorcycleId())
            .orElseThrow(() -> new ResourceNotFoundException("Motorcycle not found"));
        
        Review review = Review.builder()
            .user(user)
            .motorcycle(motorcycle)
            .rating(request.getRating())
            .title(request.getTitle())
            .content(request.getContent())
            .images(request.getImages())
            .isApproved(false)
            .isFlagged(false)
            .helpfulCount(0)
            .build();
        
        return reviewRepository.save(review);
    }
    
    public List<Review> getMotorcycleReviews(String motorcycleId) {
        return reviewRepository.findByMotorcycleIdAndIsApprovedTrue(motorcycleId);
    }
    
    public List<Review> getApprovedReviews() {
        return reviewRepository.findByIsApprovedTrue();
    }
    
    public Review approveReview(String id) {
        Review review = reviewRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Review not found"));
        review.setIsApproved(true);
        return reviewRepository.save(review);
    }
    
    public Review flagReview(String id) {
        Review review = reviewRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Review not found"));
        review.setIsFlagged(true);
        return reviewRepository.save(review);
    }
}
