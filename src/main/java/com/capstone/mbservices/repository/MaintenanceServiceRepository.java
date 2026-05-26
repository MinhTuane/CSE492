package com.capstone.mbservices.repository;

import com.capstone.mbservices.entity.MaintenanceService;
import com.capstone.mbservices.enums.ServiceStatus;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MaintenanceServiceRepository extends JpaRepository<MaintenanceService, String> {
    List<MaintenanceService> findByUserId(String userId);

    List<MaintenanceService> findByMotorcycleId(String motorcycleId);

    List<MaintenanceService> findByStatus(ServiceStatus status);

    List<MaintenanceService> findByScheduleDateBetween(LocalDateTime start, LocalDateTime end);

    List<MaintenanceService> findByUserIdOrderByScheduleDateDesc(String userId);

    Page<MaintenanceService> findByStatus(ServiceStatus status, Pageable pageable);

    List<MaintenanceService> findByStatusAndScheduleDateBefore(ServiceStatus status, LocalDateTime before);
}
