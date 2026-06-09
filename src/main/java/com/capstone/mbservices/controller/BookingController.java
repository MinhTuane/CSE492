package com.capstone.mbservices.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.capstone.mbservices.entity.TestRide;
import com.capstone.mbservices.entity.MaintenanceService;
import com.capstone.mbservices.entity.Store;
import com.capstone.mbservices.dto.request.TestRideRequest;
import com.capstone.mbservices.dto.request.ServiceScheduleRequest;
import com.capstone.mbservices.dto.response.VNPayResponse;
import com.capstone.mbservices.service.BookingService;
import com.capstone.mbservices.service.VNPayService;
import com.capstone.mbservices.config.VNPayConfig;
import org.springframework.security.access.prepost.PreAuthorize;
import java.time.LocalDateTime;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/bookings")  // NO /api prefix!
@RequiredArgsConstructor
public class BookingController {
    private final BookingService bookingService;
    private final VNPayService vnPayService;
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

    @GetMapping("/available-slots")
    public ResponseEntity<List<Map<String, Object>>> getAvailableSlots(
            @RequestParam String storeId,
            @RequestParam String date,
            @RequestParam(defaultValue = "TEST_RIDE") String type,
            @RequestParam(defaultValue = "30") int durationMinutes) {
        LocalDateTime dateTime = LocalDateTime.parse(date + "T00:00:00");
        return ResponseEntity.ok(bookingService.getAvailableSlots(storeId, dateTime, type, durationMinutes));
    }

    // ==================== DEPOSIT PAYMENT ====================

    @PostMapping("/test-rides/{id}/deposit")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<VNPayResponse> createTestRideDeposit(
            @PathVariable String id,
            HttpServletRequest request) {
        return ResponseEntity.ok(bookingService.createTestRideDepositPayment(id, request));
    }

    @GetMapping("/deposit/vnpay/verify")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TestRide> verifyDepositCallback(@RequestParam Map<String, String> params) {
        String secureHash = params.get("vnp_SecureHash");
        if (secureHash == null || secureHash.isBlank()) return ResponseEntity.badRequest().build();

        String txnRef = params.get("vnp_TxnRef");
        if (txnRef == null || txnRef.isBlank()) return ResponseEntity.badRequest().build();
        String testRideId = txnRef.contains("_") ? txnRef.split("_")[0] : txnRef;

        Map<String, String> filtered = params.entrySet().stream()
            .filter(e -> e.getKey() != null && !"vnp_SecureHash".equals(e.getKey()) && !"vnp_SecureHashType".equals(e.getKey()))
            .filter(e -> e.getValue() != null && !e.getValue().isBlank())
            .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (a, b) -> a, TreeMap::new));

        String hashData = filtered.entrySet().stream()
            .map(e -> e.getKey() + "=" + java.net.URLEncoder.encode(e.getValue(), java.nio.charset.StandardCharsets.UTF_8).replace("+", "%20"))
            .collect(Collectors.joining("&"));

        String expectedHash = VNPayConfig.hmacSHA512(vnPayService.getSecretKey(), hashData);
        if (!expectedHash.equalsIgnoreCase(secureHash)) return ResponseEntity.status(400).build();
        if (!"00".equals(params.get("vnp_ResponseCode"))) return ResponseEntity.status(400).build();

        String txn = params.getOrDefault("vnp_TransactionNo", txnRef);
        return ResponseEntity.ok(bookingService.processTestRideDeposit(testRideId, "VNPAY-" + txn));
    }

    @GetMapping("/deposit/vnpay-ipn")
    public ResponseEntity<Map<String, String>> depositIpn(@RequestParam Map<String, String> params) {
        try {
            String secureHash = params.get("vnp_SecureHash");
            if (secureHash == null || secureHash.isBlank())
                return ResponseEntity.ok(Map.of("RspCode", "97", "Message", "Invalid Signature"));

            Map<String, String> filtered = params.entrySet().stream()
                .filter(e -> e.getKey() != null && !"vnp_SecureHash".equals(e.getKey()) && !"vnp_SecureHashType".equals(e.getKey()))
                .filter(e -> e.getValue() != null && !e.getValue().isBlank())
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (a, b) -> a, TreeMap::new));

            String hashData = filtered.entrySet().stream()
                .map(e -> e.getKey() + "=" + java.net.URLEncoder.encode(e.getValue(), java.nio.charset.StandardCharsets.UTF_8).replace("+", "%20"))
                .collect(Collectors.joining("&"));

            String expectedHash = VNPayConfig.hmacSHA512(vnPayService.getSecretKey(), hashData);
            if (!expectedHash.equalsIgnoreCase(secureHash))
                return ResponseEntity.ok(Map.of("RspCode", "97", "Message", "Invalid Signature"));

            String txnRef = params.get("vnp_TxnRef");
            if (txnRef == null || txnRef.isBlank())
                return ResponseEntity.ok(Map.of("RspCode", "01", "Message", "Order Not Found"));
            String testRideId = txnRef.contains("_") ? txnRef.split("_")[0] : txnRef;

            if (!"00".equals(params.get("vnp_ResponseCode")))
                return ResponseEntity.ok(Map.of("RspCode", "00", "Message", "Confirm Success"));

            String txn = params.getOrDefault("vnp_TransactionNo", txnRef);
            bookingService.processTestRideDeposit(testRideId, "VNPAY-" + txn);
            return ResponseEntity.ok(Map.of("RspCode", "00", "Message", "Confirm Success"));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("RspCode", "99", "Message", "Unknown Error"));
        }
    }
}
