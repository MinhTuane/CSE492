package com.capstone.mbservices.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.capstone.mbservices.entity.TestRide;
import com.capstone.mbservices.entity.MaintenanceService;
import com.capstone.mbservices.entity.Store;
import com.capstone.mbservices.dto.request.TestRideRequest;
import com.capstone.mbservices.dto.request.ServiceScheduleRequest;
import com.capstone.mbservices.service.BookingService;
import org.springframework.security.access.prepost.PreAuthorize;
import java.time.LocalDateTime;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/bookings")  // NO /api prefix!
@RequiredArgsConstructor
public class BookingController {
    private final BookingService bookingService;
    @PostMapping("/test-rides")
    @PreAuthorize("#request.userId == authentication.principal.id or hasAnyRole('ADMIN', 'SUPER_ADMIN', 'BRANCH_MANAGER', 'STAFF', 'SALES_STAFF', 'SERVICE_ADVISOR')")
    public ResponseEntity<TestRide> scheduleTestRide(@Valid @RequestBody TestRideRequest request) {
        return ResponseEntity.ok(bookingService.scheduleTestRide(request));
    }
    
    @PostMapping("/services")
    @PreAuthorize("#request.userId == authentication.principal.id or hasAnyRole('ADMIN', 'SUPER_ADMIN', 'BRANCH_MANAGER', 'STAFF', 'SALES_STAFF', 'SERVICE_ADVISOR')")
    public ResponseEntity<MaintenanceService> scheduleService(@Valid @RequestBody ServiceScheduleRequest request) {
        return ResponseEntity.ok(bookingService.scheduleService(request));
    }
    
    @GetMapping("/test-rides/user/{userId}")
    @PreAuthorize("#userId == authentication.principal.id or hasAnyRole('ADMIN', 'SUPER_ADMIN', 'BRANCH_MANAGER', 'STAFF', 'SALES_STAFF', 'SERVICE_ADVISOR')")
    public ResponseEntity<List<TestRide>> getUserTestRides(@PathVariable String userId) {
        return ResponseEntity.ok(bookingService.getUserTestRides(userId));
    }
    
    @GetMapping("/services/user/{userId}")
    @PreAuthorize("#userId == authentication.principal.id or hasAnyRole('ADMIN', 'SUPER_ADMIN', 'BRANCH_MANAGER', 'STAFF', 'SALES_STAFF', 'SERVICE_ADVISOR')")
    public ResponseEntity<List<MaintenanceService>> getUserServices(@PathVariable String userId) {
        return ResponseEntity.ok(bookingService.getUserServices(userId));
    }
    
    @PutMapping("/test-rides/{id}/confirm")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'BRANCH_MANAGER', 'STAFF', 'SALES_STAFF', 'SERVICE_ADVISOR')")
    public ResponseEntity<TestRide> confirmTestRide(@PathVariable String id) {
        return ResponseEntity.ok(bookingService.confirmTestRide(id));
    }
    
    @PutMapping("/test-rides/{id}/confirm-assignment")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public ResponseEntity<TestRide> confirmAssignedTestRide(@PathVariable String id) {
        return ResponseEntity.ok(bookingService.confirmAssignedTestRide(id));
    }
    
    @PutMapping("/test-rides/{id}/propose")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public ResponseEntity<TestRide> proposeNewTime(
            @PathVariable String id,
            @RequestParam String newDate,
            @RequestParam(required = false) String note) {
        LocalDateTime dt = LocalDateTime.parse(newDate);
        return ResponseEntity.ok(bookingService.proposeNewTime(id, dt, note));
    }
    
    @DeleteMapping("/test-rides/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'BRANCH_MANAGER', 'STAFF', 'SALES_STAFF', 'SERVICE_ADVISOR') or @testRideRepository.findById(#id).orElse(null)?.user?.id == authentication.principal.id")
    public ResponseEntity<Void> cancelTestRide(@PathVariable String id) {
        bookingService.cancelTestRide(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stores")
    public ResponseEntity<List<Store>> getStores() {
        return ResponseEntity.ok(bookingService.getAllStores());
    }
    
    @GetMapping("/stores/nearest")
    public ResponseEntity<Store> getNearestStore(
            @RequestParam double lat,
            @RequestParam double lng) {
        return ResponseEntity.ok(bookingService.getNearestStore(lat, lng));
    }
    
    @GetMapping("/services/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'BRANCH_MANAGER', 'STAFF', 'SALES_STAFF', 'SERVICE_ADVISOR')")
    public ResponseEntity<Map<String, Object>> getServiceStats() {
        return ResponseEntity.ok(bookingService.getServiceStats());
    }
    
    @GetMapping("/services/recent")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'BRANCH_MANAGER', 'STAFF', 'SALES_STAFF', 'SERVICE_ADVISOR')")
    public ResponseEntity<List<MaintenanceService>> getRecentServices(
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(bookingService.getRecentServices(limit));
    }
    
    @GetMapping("/services/catalog")
    public ResponseEntity<java.util.List<com.capstone.mbservices.entity.ServiceOffering>> getServiceCatalog(
            @RequestParam(required = false) String storeId) {
        return ResponseEntity.ok(bookingService.getActiveServiceOfferings(storeId));
    }
}
