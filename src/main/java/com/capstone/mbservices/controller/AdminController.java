package com.capstone.mbservices.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.capstone.mbservices.dto.request.MotorcycleRequest;
import com.capstone.mbservices.dto.response.DashboardResponse;
import com.capstone.mbservices.entity.*;
import com.capstone.mbservices.enums.*;
import com.capstone.mbservices.service.AdminService;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'BRANCH_MANAGER', 'SALES_STAFF', 'SERVICE_ADVISOR')")
public class AdminController {
    private final AdminService adminService;

    @GetMapping("/ping")
    public ResponseEntity<Map<String, String>> ping() {
        return ResponseEntity.ok(Map.of("status", "pong"));
    }

    // ==================== DASHBOARD ====================

    @GetMapping("/dashboard/stats")
    public ResponseEntity<DashboardResponse> getDashboard(@RequestParam(required = false) String storeId) {
        try {
            DashboardResponse stats = adminService.getDashboard(storeId);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/dashboard/recent-orders")
    public ResponseEntity<List<Order>> getRecentOrders(@RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(adminService.getRecentOrders(limit));
    }

    @GetMapping("/dashboard/low-stock")
    public ResponseEntity<List<Motorcycle>> getLowStockMotorcycles() {
        return ResponseEntity.ok(adminService.getLowStockMotorcycles());
    }

    @GetMapping("/stores")
    public ResponseEntity<List<Store>> getStores() {
        return ResponseEntity.ok(adminService.getAllStores());
    }

    // ==================== MOTORCYCLE MANAGEMENT ====================

    @GetMapping("/motorcycles")
    public ResponseEntity<Map<String, Object>> getAllMotorcycles(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {

        Page<Motorcycle> motorcyclePage = adminService.getAllMotorcycles(page, size, brand, status, search);

        Map<String, Object> response = new HashMap<>();
        response.put("content", motorcyclePage.getContent());
        response.put("currentPage", motorcyclePage.getNumber());
        response.put("totalItems", motorcyclePage.getTotalElements());
        response.put("totalPages", motorcyclePage.getTotalPages());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/motorcycles")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'BRANCH_MANAGER')")
    public ResponseEntity<Motorcycle> addMotorcycle(@RequestBody MotorcycleRequest request) {
        return ResponseEntity.ok(adminService.addMotorcycle(request));
    }

    @PutMapping("/motorcycles/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'BRANCH_MANAGER')")
    public ResponseEntity<Motorcycle> updateMotorcycle(
            @PathVariable String id,
            @RequestBody MotorcycleRequest request) {
        return ResponseEntity.ok(adminService.updateMotorcycle(id, request));
    }

    @DeleteMapping("/motorcycles/{id}")
    public ResponseEntity<Void> deleteMotorcycle(@PathVariable String id) {
        adminService.deleteMotorcycle(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/motorcycles/{id}/stock")
    public ResponseEntity<Motorcycle> updateMotorcycleStock(
            @PathVariable String id,
            @RequestParam Integer stock) {
        return ResponseEntity.ok(adminService.updateMotorcycleStock(id, stock));
    }

    @PatchMapping("/motorcycles/{id}/status")
    public ResponseEntity<Motorcycle> updateMotorcycleStatus(
            @PathVariable String id,
            @RequestParam MotorcycleStatus status) {
        return ResponseEntity.ok(adminService.updateMotorcycleStatus(id, status));
    }

    // ==================== ORDER MANAGEMENT ====================

    @GetMapping("/orders")
    public ResponseEntity<Map<String, Object>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {

        Page<Order> orderPage = adminService.getAllOrders(page, size, status, search);

        Map<String, Object> response = new HashMap<>();
        response.put("content", orderPage.getContent());
        response.put("currentPage", orderPage.getNumber());
        response.put("totalItems", orderPage.getTotalElements());
        response.put("totalPages", orderPage.getTotalPages());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/orders/{orderId}")
    public ResponseEntity<Order> getOrderById(@PathVariable String orderId) {
        return ResponseEntity.ok(adminService.getOrderById(orderId));
    }

    @PatchMapping("/orders/{orderId}/status")
    public ResponseEntity<Order> updateOrderStatus(
            @PathVariable String orderId,
            @RequestParam OrderStatus status) {
        return ResponseEntity.ok(adminService.updateOrderStatus(orderId, status));
    }

    @PostMapping("/orders/{orderId}/cancel")
    public ResponseEntity<Order> cancelOrder(
            @PathVariable String orderId,
            @RequestParam(required = false) String reason) {
        return ResponseEntity.ok(adminService.cancelOrder(orderId, reason != null ? reason : "Cancelled by admin"));
    }

    // ==================== TEST RIDE STAFF ASSIGNMENT ====================
    @GetMapping("/staff/available")
    public ResponseEntity<List<Staff>> getAvailableStaff(
            @RequestParam String storeId,
            @RequestParam String start,
            @RequestParam int durationMinutes) {
        LocalDateTime startDt = LocalDateTime.parse(start);
        return ResponseEntity.ok(adminService.getAvailableStaff(storeId, startDt, durationMinutes));
    }

    @PatchMapping("/test-rides/{id}/assign-staff")
    public ResponseEntity<TestRide> assignStaffToTestRide(
            @PathVariable String id,
            @RequestParam String staffId) {
        return ResponseEntity.ok(adminService.assignStaffToTestRide(id, staffId));
    }

    @PatchMapping("/test-rides/{id}/status")
    public ResponseEntity<TestRide> updateTestRideStatus(
            @PathVariable String id,
            @RequestParam TestRideStatus status) {
        return ResponseEntity.ok(adminService.updateTestRideStatus(id, status));
    }

    @PatchMapping("/test-rides/{id}/store")
    public ResponseEntity<TestRide> updateTestRideStore(
            @PathVariable String id,
            @RequestParam String storeId) {
        return ResponseEntity.ok(adminService.updateTestRideStore(id, storeId));
    }

    // ==================== USER MANAGEMENT ====================

    @GetMapping("/users")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String search) {

        Page<User> userPage = adminService.getAllUsers(page, size, role, search);

        Map<String, Object> response = new HashMap<>();
        response.put("content", userPage.getContent());
        response.put("currentPage", userPage.getNumber());
        response.put("totalItems", userPage.getTotalElements());
        response.put("totalPages", userPage.getTotalPages());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/users/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<User> getUserDetails(@PathVariable String userId) {
        return ResponseEntity.ok(adminService.getUserDetails(userId));
    }

    // ==================== STORE / FRANCHISE ====================
    @PatchMapping("/stores/{storeId}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Store> approveStore(
            @PathVariable String storeId,
            @RequestParam String brand) {
        return ResponseEntity.ok(adminService.approveStore(storeId, brand));
    }
    
    @PatchMapping("/stores/{storeId}/contract")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Store> setStoreContract(
            @PathVariable String storeId,
            @RequestParam(defaultValue = "3") int years) {
        return ResponseEntity.ok(adminService.setStoreContract(storeId, years));
    }

    @PutMapping("/stores/{storeId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Store> updateStore(
            @PathVariable String storeId,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(adminService.updateStore(storeId, body));
    }

    @PatchMapping("/users/{userId}/role")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<User> updateUserRole(
            @PathVariable String userId,
            @RequestParam UserRole role) {
        return ResponseEntity.ok(adminService.updateUserRole(userId, role));
    }

    @PatchMapping("/users/{userId}/toggle-status")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<User> toggleUserStatus(@PathVariable String userId) {
        return ResponseEntity.ok(adminService.toggleUserStatus(userId));
    }

    @PostMapping("/users/{userId}/assign-store")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Staff> assignStaffToStore(
            @PathVariable String userId,
            @RequestParam String storeId) {
        return ResponseEntity.ok(adminService.assignStaffToStore(userId, storeId));
    }

    @DeleteMapping("/users/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable String userId) {
        adminService.deleteUser(userId);
        return ResponseEntity.ok().build();
    }

    // ==================== BOOKING MANAGEMENT ====================

    @GetMapping("/test-rides")
    public ResponseEntity<Map<String, Object>> getAllTestRides(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status) {

        Page<TestRide> testRidePage = adminService.getAllTestRides(page, size, status);

        Map<String, Object> response = new HashMap<>();
        response.put("content", testRidePage.getContent());
        response.put("currentPage", testRidePage.getNumber());
        response.put("totalItems", testRidePage.getTotalElements());
        response.put("totalPages", testRidePage.getTotalPages());

        return ResponseEntity.ok(response);
    }

    @PatchMapping("/test-rides/{testRideId}/approve")
    public ResponseEntity<TestRide> approveTestRide(@PathVariable String testRideId) {
        return ResponseEntity.ok(adminService.approveTestRide(testRideId));
    }

    @PatchMapping("/test-rides/{testRideId}/reject")
    public ResponseEntity<TestRide> rejectTestRide(
            @PathVariable String testRideId,
            @RequestParam(required = false) String reason) {
        return ResponseEntity
                .ok(adminService.rejectTestRide(testRideId, reason != null ? reason : "Rejected by admin"));
    }

    @PatchMapping("/test-rides/{testRideId}/complete")
    public ResponseEntity<TestRide> completeTestRide(@PathVariable String testRideId) {
        return ResponseEntity.ok(adminService.completeTestRide(testRideId));
    }

    @GetMapping("/services")
    public ResponseEntity<Map<String, Object>> getAllServices(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status) {

        Page<MaintenanceService> servicePage = adminService.getAllServices(page, size, status);

        Map<String, Object> response = new HashMap<>();
        response.put("content", servicePage.getContent());
        response.put("currentPage", servicePage.getNumber());
        response.put("totalItems", servicePage.getTotalElements());
        response.put("totalPages", servicePage.getTotalPages());

        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/services")
    public ResponseEntity<MaintenanceService> createService(@RequestBody com.capstone.mbservices.dto.request.ServiceScheduleRequest request) {
        return ResponseEntity.ok(adminService.createService(request));
    }

    @PatchMapping("/services/{serviceId}/status")
    public ResponseEntity<MaintenanceService> updateServiceStatus(
            @PathVariable String serviceId,
            @RequestParam ServiceStatus status) {
        return ResponseEntity.ok(adminService.updateServiceStatus(serviceId, status));
    }
    
    @PutMapping("/services/{serviceId}")
    public ResponseEntity<MaintenanceService> updateService(
            @PathVariable String serviceId,
            @RequestBody com.capstone.mbservices.dto.request.ServiceUpdateRequest request) {
        return ResponseEntity.ok(adminService.updateService(serviceId, request));
    }

    @DeleteMapping("/services/{serviceId}")
    public ResponseEntity<Void> deleteService(@PathVariable String serviceId) {
        adminService.deleteService(serviceId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/services/{serviceId}/assign-staff")
    public ResponseEntity<MaintenanceService> assignStaffToService(
            @PathVariable String serviceId,
            @RequestParam String staffId) {
        return ResponseEntity.ok(adminService.assignStaffToService(serviceId, staffId));
    }

    // ==================== SERVICE CATALOG ====================
    @GetMapping("/service-offerings")
    public ResponseEntity<Map<String, Object>> getAllServiceOfferings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String storeId) {
        Page<ServiceOffering> offerings = adminService.getAllServiceOfferings(page, size, search, storeId);
        Map<String, Object> response = new HashMap<>();
        response.put("content", offerings.getContent());
        response.put("currentPage", offerings.getNumber());
        response.put("totalItems", offerings.getTotalElements());
        response.put("totalPages", offerings.getTotalPages());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/service-offerings")
    public ResponseEntity<ServiceOffering> createServiceOffering(
            @RequestBody com.capstone.mbservices.dto.request.ServiceOfferingRequest request) {
        return ResponseEntity.ok(adminService.createServiceOffering(request));
    }

    @PutMapping("/service-offerings/{id}")
    public ResponseEntity<ServiceOffering> updateServiceOffering(
            @PathVariable String id,
            @RequestBody com.capstone.mbservices.dto.request.ServiceOfferingRequest request) {
        return ResponseEntity.ok(adminService.updateServiceOffering(id, request));
    }
    
    @PostMapping("/migrate-images")
    public ResponseEntity<java.util.Map<String, Object>> migrateImages() {
        java.util.Map<String, Object> motorcycle = adminService.migrateMotorcycleImages();
        java.util.Map<String, Object> reviews = adminService.migrateReviewImages();
        java.util.Map<String, Object> combined = new java.util.HashMap<>();
        combined.put("motorcycles", motorcycle);
        combined.put("reviews", reviews);
        combined.put("message", "Migration completed");
        return ResponseEntity.ok(combined);
    }
    
    @PostMapping("/restore-local-images")
    public ResponseEntity<java.util.Map<String, Object>> restoreLocalImages() {
        java.util.Map<String, Object> motorcycle = adminService.restoreLocalMotorcycleImages();
        java.util.Map<String, Object> combined = new java.util.HashMap<>();
        combined.put("motorcycles", motorcycle);
        combined.put("message", "Local image restore completed");
        return ResponseEntity.ok(combined);
    }

    @PatchMapping("/service-offerings/{id}/active")
    public ResponseEntity<ServiceOffering> setServiceOfferingActive(
            @PathVariable String id,
            @RequestParam boolean active) {
        return ResponseEntity.ok(adminService.setServiceOfferingActive(id, active));
    }

    @DeleteMapping("/service-offerings/{id}")
    public ResponseEntity<Void> deleteServiceOffering(@PathVariable String id) {
        adminService.deleteServiceOffering(id);
        return ResponseEntity.ok().build();
    }

    // ==================== FORUM MODERATION ====================

    @GetMapping("/forum/posts")
    public ResponseEntity<Map<String, Object>> getAllForumPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean hidden) {

        Page<ForumPost> postPage = adminService.getAllForumPosts(page, size, category, search, hidden);
        Map<String, Object> response = new HashMap<>();
        response.put("content", postPage.getContent());
        response.put("currentPage", postPage.getNumber());
        response.put("totalItems", postPage.getTotalElements());
        response.put("totalPages", postPage.getTotalPages());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/forum/posts/{id}/hot")
    public ResponseEntity<ForumPost> setForumPostHot(
            @PathVariable String id,
            @RequestParam boolean hot) {
        return ResponseEntity.ok(adminService.setForumPostHot(id, hot));
    }

    @PatchMapping("/forum/posts/{id}/hidden")
    public ResponseEntity<ForumPost> setForumPostHidden(
            @PathVariable String id,
            @RequestParam boolean hidden) {
        return ResponseEntity.ok(adminService.setForumPostHidden(id, hidden));
    }

    @DeleteMapping("/forum/posts/{id}")
    public ResponseEntity<Void> deleteForumPost(@PathVariable String id) {
        adminService.deleteForumPost(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/forum/comments/{id}/hidden")
    public ResponseEntity<ForumComment> setForumCommentHidden(
            @PathVariable String id,
            @RequestParam boolean hidden) {
        return ResponseEntity.ok(adminService.setForumCommentHidden(id, hidden));
    }

    @PatchMapping("/forum/comments/{id}/flag")
    public ResponseEntity<ForumComment> flagForumComment(@PathVariable String id) {
        return ResponseEntity.ok(adminService.flagForumComment(id));
    }

    @DeleteMapping("/forum/comments/{id}")
    public ResponseEntity<Void> deleteForumComment(@PathVariable String id) {
        adminService.deleteForumComment(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/forum/posts/{postId}/comments")
    public ResponseEntity<Map<String, Object>> getForumCommentsByPost(
            @PathVariable String postId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<ForumComment> commentPage = adminService.getForumCommentsByPost(postId, page, size);
        Map<String, Object> response = new HashMap<>();
        response.put("content", commentPage.getContent());
        response.put("currentPage", commentPage.getNumber());
        response.put("totalItems", commentPage.getTotalElements());
        response.put("totalPages", commentPage.getTotalPages());
        return ResponseEntity.ok(response);
    }

    // ==================== REVIEW MANAGEMENT ====================

    @GetMapping("/reviews")
    public ResponseEntity<Map<String, Object>> getAllReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Boolean approved) {

        Page<Review> reviewPage = adminService.getAllReviews(page, size, approved);

        Map<String, Object> response = new HashMap<>();
        response.put("content", reviewPage.getContent());
        response.put("currentPage", reviewPage.getNumber());
        response.put("totalItems", reviewPage.getTotalElements());
        response.put("totalPages", reviewPage.getTotalPages());

        return ResponseEntity.ok(response);
    }

    @PatchMapping("/reviews/{reviewId}/approve")
    public ResponseEntity<Review> approveReview(@PathVariable String reviewId) {
        return ResponseEntity.ok(adminService.approveReview(reviewId));
    }

    @PatchMapping("/reviews/{reviewId}/reject")
    public ResponseEntity<Review> rejectReview(@PathVariable String reviewId) {
        return ResponseEntity.ok(adminService.rejectReview(reviewId));
    }

    @DeleteMapping("/reviews/{reviewId}")
    public ResponseEntity<Void> deleteReview(@PathVariable String reviewId) {
        adminService.deleteReview(reviewId);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/reviews/{reviewId}/flag")
    public ResponseEntity<Review> flagReview(@PathVariable String reviewId) {
        return ResponseEntity.ok(adminService.flagReview(reviewId));
    }
}
