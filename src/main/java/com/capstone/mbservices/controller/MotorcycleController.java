package com.capstone.mbservices.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.capstone.mbservices.entity.Motorcycle;
import com.capstone.mbservices.dto.request.MotorcycleRequest;
import com.capstone.mbservices.service.MotorcycleService;
import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/motorcycles")  // NO /api prefix! context-path adds it
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MotorcycleController {
    private final MotorcycleService motorcycleService;
    
    @GetMapping("/all")
    public ResponseEntity<List<Motorcycle>> getAll() {
        return ResponseEntity.ok(motorcycleService.getAllMotorcycles());
    }
    
    @GetMapping("/available")
    public ResponseEntity<List<Motorcycle>> getAvailable() {
        return ResponseEntity.ok(motorcycleService.getAvailableMotorcycles());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Motorcycle> getById(@PathVariable String id) {
        return ResponseEntity.ok(motorcycleService.getMotorcycleById(id));
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<Motorcycle>> search(
        @RequestParam(required = false) String brand,
        @RequestParam(required = false) String category,
        @RequestParam(required = false) Double minPrice,
        @RequestParam(required = false) Double maxPrice,
        @RequestParam(required = false) Integer year
    ) {
        return ResponseEntity.ok(motorcycleService.searchMotorcycles(brand, category, minPrice, maxPrice, year));
    }
    
    @GetMapping("/search-paged")
    public ResponseEntity<org.springframework.data.domain.Page<Motorcycle>> searchPaged(
        @RequestParam(required = false) String brand,
        @RequestParam(required = false) String category,
        @RequestParam(required = false) Double minPrice,
        @RequestParam(required = false) Double maxPrice,
        @RequestParam(required = false) Integer year,
        @RequestParam(required = false) com.capstone.mbservices.enums.MotorcycleStatus status,
        @RequestParam(required = false) String keyword,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(defaultValue = "createAt") String sort,
        @RequestParam(defaultValue = "desc") String direction
    ) {
        org.springframework.data.domain.Sort.Direction sortDirection = org.springframework.data.domain.Sort.Direction.fromString(direction);
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by(sortDirection, sort));
        return ResponseEntity.ok(motorcycleService.searchMotorcyclesPaged(brand, category, minPrice, maxPrice, year, status, keyword, pageable));
    }
    
    @GetMapping("/brands")
    public ResponseEntity<List<String>> getBrands() {
        return ResponseEntity.ok(motorcycleService.getAllBrands());
    }
    
    @GetMapping("/categories")
    public ResponseEntity<List<String>> getCategories() {
        return ResponseEntity.ok(motorcycleService.getAllCategories());
    }
    
    @PostMapping("/compare")
    public ResponseEntity<List<Motorcycle>> compare(@RequestBody List<String> ids) {
        return ResponseEntity.ok(motorcycleService.compareMotorcycles(ids));
    }
    
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'BRANCH_MANAGER', 'STAFF', 'SALES_STAFF', 'SERVICE_ADVISOR')")
    public ResponseEntity<Motorcycle> create(@Valid @RequestBody MotorcycleRequest request) {
        return ResponseEntity.ok(motorcycleService.createMotorcycle(request));
    }
    
    @PostMapping("/with-images")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'BRANCH_MANAGER', 'STAFF', 'SALES_STAFF', 'SERVICE_ADVISOR')")
    public ResponseEntity<Motorcycle> createWithImages(
            @RequestPart("motorcycle") @Valid MotorcycleRequest request,
            @RequestPart(value = "images", required = false) MultipartFile[] images) {
        
        Motorcycle motorcycle = motorcycleService.createMotorcycleWithImages(request, images);
        return ResponseEntity.ok(motorcycle);
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'BRANCH_MANAGER', 'STAFF', 'SALES_STAFF', 'SERVICE_ADVISOR')")
    public ResponseEntity<Motorcycle> update(
            @PathVariable String id, 
            @Valid @RequestBody MotorcycleRequest request) {
        return ResponseEntity.ok(motorcycleService.updateMotorcycle(id, request));
    }
    
    @PutMapping("/{id}/with-images")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'BRANCH_MANAGER', 'STAFF', 'SALES_STAFF', 'SERVICE_ADVISOR')")
    public ResponseEntity<Motorcycle> updateWithImages(
            @PathVariable String id,
            @RequestPart("motorcycle") @Valid MotorcycleRequest request,
            @RequestPart(value = "newImages", required = false) MultipartFile[] newImages,
            @RequestParam(value = "deleteImageUrls", required = false) List<String> deleteUrls) {
        
        Motorcycle motorcycle = motorcycleService.updateMotorcycleWithImages(
            id, request, newImages, deleteUrls
        );
        return ResponseEntity.ok(motorcycle);
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'BRANCH_MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        motorcycleService.deleteMotorcycle(id);
        return ResponseEntity.noContent().build();
    }
    
    @DeleteMapping("/{id}/with-images")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteWithImages(@PathVariable String id) {
        motorcycleService.deleteMotorcycleWithImages(id);
        return ResponseEntity.noContent().build();
    }
    
    @PostMapping("/{id}/images")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'BRANCH_MANAGER', 'STAFF', 'SALES_STAFF', 'SERVICE_ADVISOR')")
    public ResponseEntity<Motorcycle> addImages(
            @PathVariable String id,
            @RequestPart("images") MultipartFile[] images) {
        return ResponseEntity.ok(motorcycleService.addImages(id, images));
    }
    
    @DeleteMapping("/{id}/images")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<Motorcycle> removeImage(
            @PathVariable String id,
            @RequestParam("url") String imageUrl) {
        return ResponseEntity.ok(motorcycleService.removeImage(id, imageUrl));
    }
    
    @PutMapping("/{id}/images/replace")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<Motorcycle> replaceAllImages(
            @PathVariable String id,
            @RequestPart("images") MultipartFile[] images) {
        return ResponseEntity.ok(motorcycleService.replaceAllImages(id, images));
    }
}
