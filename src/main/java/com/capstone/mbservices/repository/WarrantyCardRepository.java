package com.capstone.mbservices.repository;

import com.capstone.mbservices.entity.WarrantyCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface WarrantyCardRepository extends JpaRepository<WarrantyCard, String> {
    List<WarrantyCard> findByUserId(String userId);
}
