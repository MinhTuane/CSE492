package com.capstone.mbservices.controller;

import com.capstone.mbservices.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/upload")  // NO /api prefix!
@RequiredArgsConstructor
public class ImageUploadController {
    
    private final CloudinaryService cloudinaryService;
    
    @PostMapping("/image")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'CUSTOMER')")
    public ResponseEntity<Map<String, String>> uploadSingleImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", defaultValue = "general") String folder) {
        
        String imageUrl = cloudinaryService.uploadImage(file, folder);
        
        Map<String, String> response = new HashMap<>();
        response.put("url", imageUrl);
        response.put("message", "Image uploaded successfully");
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/images")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'CUSTOMER')")
    public ResponseEntity<Map<String, Object>> uploadMultipleImages(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam(value = "folder", defaultValue = "general") String folder) {
        
        List<String> imageUrls = cloudinaryService.uploadMultipleImages(files, folder);
        
        Map<String, Object> response = new HashMap<>();
        response.put("urls", imageUrls);
        response.put("count", imageUrls.size());
        response.put("message", "Images uploaded successfully");
        
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/image")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'BRANCH_MANAGER', 'STAFF', 'SALES_STAFF', 'SERVICE_ADVISOR')")
    public ResponseEntity<Map<String, String>> deleteImage(@RequestParam("url") String imageUrl) {
        cloudinaryService.deleteImage(imageUrl);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Image deleted successfully");
        
        return ResponseEntity.ok(response);
    }
}
