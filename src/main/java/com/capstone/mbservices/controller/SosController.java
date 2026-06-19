package com.capstone.mbservices.controller;

import com.capstone.mbservices.entity.SosRequest;
import com.capstone.mbservices.exception.BadRequestException;
import com.capstone.mbservices.exception.ResourceNotFoundException;
import com.capstone.mbservices.repository.SosRequestRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/sos")
@RequiredArgsConstructor
public class SosController {
    private final SosRequestRepository sosRequestRepository;

    private static final Set<String> ALLOWED_STATUSES = Set.of("PENDING", "DISPATCHED", "RESOLVED", "CANCELLED");

    @Data
    public static class SosCreateRequest {
        @NotBlank
        @Pattern(regexp = "^[0-9]{10,11}$", message = "Invalid phone number")
        private String phone;
        @NotNull
        private Double latitude;
        @NotNull
        private Double longitude;
        private String description;
        private String userId;
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SosRequest> createSosRequest(@Valid @RequestBody SosCreateRequest request) {
        SosRequest sos = SosRequest.builder()
                .phone(request.getPhone())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .description(request.getDescription())
                .userId(request.getUserId())
                .status("PENDING")
                .build();
        return ResponseEntity.ok(sosRequestRepository.save(sos));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF_SERVICE')")
    public ResponseEntity<List<SosRequest>> getPendingRequests() {
        return ResponseEntity.ok(sosRequestRepository.findByStatusOrderByCreateAtDesc("PENDING"));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF_SERVICE')")
    public ResponseEntity<SosRequest> updateStatus(@PathVariable String id, @RequestParam String status) {
        if (status == null || !ALLOWED_STATUSES.contains(status.toUpperCase())) {
            throw new BadRequestException("Invalid status. Allowed: " + ALLOWED_STATUSES);
        }
        SosRequest req = sosRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SOS request not found"));
        req.setStatus(status.toUpperCase());
        return ResponseEntity.ok(sosRequestRepository.save(req));
    }
}