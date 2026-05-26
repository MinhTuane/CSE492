package com.capstone.mbservices.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import com.capstone.mbservices.entity.Motorcycle;
import com.capstone.mbservices.dto.request.MotorcycleRequest;
import com.capstone.mbservices.enums.MotorcycleStatus;
import com.capstone.mbservices.exception.ResourceNotFoundException;
import com.capstone.mbservices.repository.MotorcycleRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MotorcycleService {
    private final MotorcycleRepository motorcycleRepository;
    private final CloudinaryService cloudinaryService;
    
    // ==================== BASIC CRUD (No Image Upload) ====================
    
    public List<Motorcycle> getAllMotorcycles() {
        return motorcycleRepository.findAll();
    }
    
    public List<Motorcycle> getAvailableMotorcycles() {
        return motorcycleRepository.findByStatus(MotorcycleStatus.AVAILABLE);
    }
    
    public Motorcycle getMotorcycleById(String id) {
        return motorcycleRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Motorcycle not found with id: " + id));
    }
    
    public List<Motorcycle> searchMotorcycles(String brand, String category, 
                                             Double minPrice, Double maxPrice, Integer year) {
        return motorcycleRepository.searchMotorcycles(brand, category, minPrice, maxPrice, year);
    }
    
    public org.springframework.data.domain.Page<Motorcycle> searchMotorcyclesPaged(
            String brand, String category, Double minPrice, Double maxPrice, Integer year,
            MotorcycleStatus status, String keyword, org.springframework.data.domain.Pageable pageable) {
        return motorcycleRepository.searchMotorcyclesPaged(brand, category, minPrice, maxPrice, year, status, keyword, pageable);
    }
    
    @Cacheable("brands")
    public List<String> getAllBrands() {
        return motorcycleRepository.findAllBrands();
    }
    
    @Cacheable("categories")
    public List<String> getAllCategories() {
        return motorcycleRepository.findAllCategories();
    }
    
    public List<Motorcycle> compareMotorcycles(List<String> ids) {
        return motorcycleRepository.findAllById(ids);
    }
    
    // ==================== CREATE WITH IMAGE URLS (Frontend already uploaded) ====================
    
    /**
     * Create motorcycle with pre-uploaded image URLs
     * Used when frontend uploads images first, then creates motorcycle
     */
    @CacheEvict(value = {"brands", "categories"}, allEntries = true)
    public Motorcycle createMotorcycle(MotorcycleRequest request) {
        Motorcycle motorcycle = Motorcycle.builder()
            .brand(request.getBrand())
            .model(request.getModel())
            .year(request.getYear())
            .category(request.getCategory())
            .price(request.getPrice())
            .description(request.getDescription())
            .engineType(request.getEngineType())
            .displacement(request.getDisplacement())
            .power(request.getPower())
            .torque(request.getTorque())
            .weight(request.getWeight())
            .topSpeed(request.getTopSpeed())
            .fuelCapacity(request.getFuelCapacity())
            .stock(request.getStock())
            .images(request.getImages()) // URLs from frontend
            .features(request.getFeatures())
            .color(request.getColor())
            .status(MotorcycleStatus.AVAILABLE)
            .build();
        
        return motorcycleRepository.save(motorcycle);
    }
    
    // ==================== CREATE WITH IMAGE FILES (Upload during creation) ====================
    
    /**
     * Create motorcycle and upload images in one request
     * Used when frontend sends image files with motorcycle data
     */
    @CacheEvict(value = {"brands", "categories"}, allEntries = true)
    public Motorcycle createMotorcycleWithImages(
            MotorcycleRequest request, 
            MultipartFile[] imageFiles) {
        
        List<String> imageUrls = new ArrayList<>();
        
        // Upload images to Cloudinary if provided
        if (imageFiles != null && imageFiles.length > 0) {
            imageUrls = cloudinaryService.uploadMultipleImages(imageFiles, "motorcycles");
        }
        
        Motorcycle motorcycle = Motorcycle.builder()
            .brand(request.getBrand())
            .model(request.getModel())
            .year(request.getYear())
            .category(request.getCategory())
            .price(request.getPrice())
            .description(request.getDescription())
            .engineType(request.getEngineType())
            .displacement(request.getDisplacement())
            .power(request.getPower())
            .torque(request.getTorque())
            .weight(request.getWeight())
            .topSpeed(request.getTopSpeed())
            .fuelCapacity(request.getFuelCapacity())
            .stock(request.getStock())
            .images(imageUrls) // Cloudinary URLs
            .features(request.getFeatures())
            .color(request.getColor())
            .status(MotorcycleStatus.AVAILABLE)
            .build();
        
        return motorcycleRepository.save(motorcycle);
    }
    
    // ==================== UPDATE ====================
    
    /**
     * Update motorcycle without changing images
     */
    @CacheEvict(value = {"brands", "categories"}, allEntries = true)
    public Motorcycle updateMotorcycle(String id, MotorcycleRequest request) {
        Motorcycle motorcycle = getMotorcycleById(id);
        
        motorcycle.setBrand(request.getBrand());
        motorcycle.setModel(request.getModel());
        motorcycle.setYear(request.getYear());
        motorcycle.setCategory(request.getCategory());
        motorcycle.setPrice(request.getPrice());
        motorcycle.setDescription(request.getDescription());
        motorcycle.setEngineType(request.getEngineType());
        motorcycle.setDisplacement(request.getDisplacement());
        motorcycle.setPower(request.getPower());
        motorcycle.setTorque(request.getTorque());
        motorcycle.setWeight(request.getWeight());
        motorcycle.setTopSpeed(request.getTopSpeed());
        motorcycle.setFuelCapacity(request.getFuelCapacity());
        motorcycle.setStock(request.getStock());
        motorcycle.setFeatures(request.getFeatures());
        motorcycle.setColor(request.getColor());
        
        // Keep existing images if no new URLs provided
        if (request.getImages() != null && !request.getImages().isEmpty()) {
            motorcycle.setImages(request.getImages());
        }
        
        return motorcycleRepository.save(motorcycle);
    }
    
    /**
     * Update motorcycle with image management
     * - Can delete old images
     * - Can add new images
     * - Can keep existing images
     */
    @CacheEvict(value = {"brands", "categories"}, allEntries = true)
    public Motorcycle updateMotorcycleWithImages(
            String id, 
            MotorcycleRequest request, 
            MultipartFile[] newImageFiles,
            List<String> imagesToDelete) {
        
        Motorcycle motorcycle = getMotorcycleById(id);
        
        // Initialize images list if null
        if (motorcycle.getImages() == null) {
            motorcycle.setImages(new ArrayList<>());
        }
        
        // Delete specified images from Cloudinary and list
        if (imagesToDelete != null && !imagesToDelete.isEmpty()) {
            cloudinaryService.deleteMultipleImages(imagesToDelete);
            motorcycle.getImages().removeAll(imagesToDelete);
        }
        
        // Upload and add new images
        if (newImageFiles != null && newImageFiles.length > 0) {
            List<String> newUrls = cloudinaryService.uploadMultipleImages(newImageFiles, "motorcycles");
            motorcycle.getImages().addAll(newUrls);
        }
        
        // Update other fields
        motorcycle.setBrand(request.getBrand());
        motorcycle.setModel(request.getModel());
        motorcycle.setYear(request.getYear());
        motorcycle.setCategory(request.getCategory());
        motorcycle.setPrice(request.getPrice());
        motorcycle.setDescription(request.getDescription());
        motorcycle.setEngineType(request.getEngineType());
        motorcycle.setDisplacement(request.getDisplacement());
        motorcycle.setPower(request.getPower());
        motorcycle.setTorque(request.getTorque());
        motorcycle.setWeight(request.getWeight());
        motorcycle.setTopSpeed(request.getTopSpeed());
        motorcycle.setFuelCapacity(request.getFuelCapacity());
        motorcycle.setStock(request.getStock());
        motorcycle.setFeatures(request.getFeatures());
        motorcycle.setColor(request.getColor());
        
        return motorcycleRepository.save(motorcycle);
    }
    
    // ==================== DELETE ====================
    
    /**
     * Delete motorcycle without deleting images from Cloudinary
     * Use this if images are shared or managed externally
     */
    @CacheEvict(value = {"brands", "categories"}, allEntries = true)
    public void deleteMotorcycle(String id) {
        Motorcycle motorcycle = getMotorcycleById(id);
        motorcycleRepository.delete(motorcycle);
    }
    
    /**
     * Delete motorcycle and all its images from Cloudinary
     * Use this for complete removal
     */
    @CacheEvict(value = {"brands", "categories"}, allEntries = true)
    public void deleteMotorcycleWithImages(String id) {
        Motorcycle motorcycle = getMotorcycleById(id);
        
        // Delete all images from Cloudinary
        if (motorcycle.getImages() != null && !motorcycle.getImages().isEmpty()) {
            cloudinaryService.deleteMultipleImages(motorcycle.getImages());
        }
        
        // Delete motorcycle from database
        motorcycleRepository.delete(motorcycle);
    }
    
    // ==================== IMAGE MANAGEMENT ====================
    
    /**
     * Add images to existing motorcycle
     */
    public Motorcycle addImages(String motorcycleId, MultipartFile[] imageFiles) {
        Motorcycle motorcycle = getMotorcycleById(motorcycleId);
        
        if (imageFiles != null && imageFiles.length > 0) {
            List<String> newUrls = cloudinaryService.uploadMultipleImages(imageFiles, "motorcycles");
            
            if (motorcycle.getImages() == null) {
                motorcycle.setImages(new ArrayList<>());
            }
            
            motorcycle.getImages().addAll(newUrls);
            return motorcycleRepository.save(motorcycle);
        }
        
        return motorcycle;
    }
    
    /**
     * Remove specific image from motorcycle
     */
    public Motorcycle removeImage(String motorcycleId, String imageUrl) {
        Motorcycle motorcycle = getMotorcycleById(motorcycleId);
        
        if (motorcycle.getImages() != null && motorcycle.getImages().contains(imageUrl)) {
            // Delete from Cloudinary
            cloudinaryService.deleteImage(imageUrl);
            
            // Remove from list
            motorcycle.getImages().remove(imageUrl);
            return motorcycleRepository.save(motorcycle);
        }
        
        return motorcycle;
    }
    
    /**
     * Replace all images of motorcycle
     */
    public Motorcycle replaceAllImages(String motorcycleId, MultipartFile[] newImageFiles) {
        Motorcycle motorcycle = getMotorcycleById(motorcycleId);
        
        // Delete old images from Cloudinary
        if (motorcycle.getImages() != null && !motorcycle.getImages().isEmpty()) {
            cloudinaryService.deleteMultipleImages(motorcycle.getImages());
        }
        
        // Upload new images
        List<String> newUrls = new ArrayList<>();
        if (newImageFiles != null && newImageFiles.length > 0) {
            newUrls = cloudinaryService.uploadMultipleImages(newImageFiles, "motorcycles");
        }
        
        motorcycle.setImages(newUrls);
        return motorcycleRepository.save(motorcycle);
    }
}