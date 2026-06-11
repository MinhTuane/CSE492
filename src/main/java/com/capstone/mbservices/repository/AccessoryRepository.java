package com.capstone.mbservices.repository;

import com.capstone.mbservices.entity.Accessory;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccessoryRepository extends JpaRepository<Accessory, String> {
    List<Accessory> findByIsActiveTrue();
    
    @Query("SELECT a FROM Accessory a WHERE a.isActive = true AND (" +
           "LOWER(a.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(a.category) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(a.compatibleBikes) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(a.brand) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Accessory> searchAccessories(String keyword, Pageable pageable);

    /**
     * Acquire pessimistic write lock on an accessory row to serialize
     * concurrent stock-update operations (reserve / restore on order flow).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Accessory a WHERE a.id = :id")
    Optional<Accessory> findByIdForUpdate(@Param("id") String id);
}
