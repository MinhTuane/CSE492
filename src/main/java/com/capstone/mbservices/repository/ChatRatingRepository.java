package com.capstone.mbservices.repository;

import com.capstone.mbservices.entity.ChatRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatRatingRepository extends JpaRepository<ChatRating, String> {
}
