package com.capstone.mbservices.repository;

import com.capstone.mbservices.entity.TestRide;
import com.capstone.mbservices.entity.User;
import com.capstone.mbservices.enums.TestRideStatus;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TestRideRepository extends JpaRepository<TestRide, String> {
    List<TestRide> findByUserId(String userId);

    List<TestRide> findByMotorcycleId(String motorcycleId);

    List<TestRide> findByScheduleDateBetween(LocalDateTime start, LocalDateTime end);

    List<TestRide> findByStatus(TestRideStatus status);

    List<TestRide> findByUserIdOrderByScheduleDateDesc(String userId);
    
    List<TestRide> findByUserIdOrderByScheduleDateTimeDesc(String userId);

    long countByStatus(TestRideStatus status);

    Page<TestRide> findByStatus(TestRideStatus status, Pageable pageable);

    List<TestRide> findByUser(User user);

    List<TestRide> findByAssignedStaffIdAndScheduleDateBetween(String staffId, LocalDateTime start, LocalDateTime end);
    
    List<TestRide> findByAssignedStaffIdAndScheduleDateTimeBetween(String staffId, LocalDateTime start, LocalDateTime end);

    List<TestRide> findByStoreIdAndScheduleDateBetween(String storeId, LocalDateTime start, LocalDateTime end);
    
    List<TestRide> findByStoreIdAndScheduleDateTimeBetween(String storeId, LocalDateTime start, LocalDateTime end);

    List<TestRide> findByAssignedStaffId(String staffId);
}
