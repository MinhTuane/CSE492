package com.capstone.mbservices.repository;

import com.capstone.mbservices.entity.Review;
import com.capstone.mbservices.entity.User;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, String> {
    List<Review> findByMotorcycleId(String motorcycleId);

    List<Review> findByUserId(String userId);

    List<Review> findByIsApprovedTrue();

    List<Review> findByMotorcycleIdAndIsApprovedTrue(String motorcycleId);

    List<Review> findByIsFlaggedTrue();

    long countByIsApproved(boolean isApproved);

    Page<Review> findByIsApproved(boolean isApproved, Pageable pageable);

    List<Review> findByUser(User user);

    Long countByIsApproved(Boolean isApproved);

    boolean existsByUserIdAndMotorcycleId(String userId, String motorcycleId);
}
