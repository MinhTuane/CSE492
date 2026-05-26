package com.capstone.mbservices.repository;

import com.capstone.mbservices.entity.SosRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SosRequestRepository extends JpaRepository<SosRequest, String> {
    List<SosRequest> findByStatusOrderByCreateAtDesc(String status);
}