package com.capstone.mbservices.repository;

import com.capstone.mbservices.entity.RegistrationDetails;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RegistrationDetailsRepository extends JpaRepository<RegistrationDetails, String> {
}
