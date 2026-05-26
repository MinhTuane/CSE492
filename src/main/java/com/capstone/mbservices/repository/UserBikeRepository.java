package com.capstone.mbservices.repository;

import com.capstone.mbservices.entity.UserBike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserBikeRepository extends JpaRepository<UserBike, String> {
    List<UserBike> findByUserIdOrderByCreateAtDesc(String userId);
}