package com.capstone.mbservices.repository;

import com.capstone.mbservices.entity.ServiceOffering;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceOfferingRepository extends JpaRepository<ServiceOffering, String> {
    List<ServiceOffering> findByActiveTrue();
    Page<ServiceOffering> findByNameContainingIgnoreCase(String name, Pageable pageable);
    Optional<ServiceOffering> findByNameIgnoreCase(String name);
    List<ServiceOffering> findByStoreIdAndActiveTrue(String storeId);
    Page<ServiceOffering> findByStoreId(String storeId, Pageable pageable);
}
