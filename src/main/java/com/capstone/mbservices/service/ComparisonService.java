package com.capstone.mbservices.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.capstone.mbservices.entity.Motorcycle;
import com.capstone.mbservices.repository.MotorcycleRepository;
import com.capstone.mbservices.exception.ResourceNotFoundException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ComparisonService {
    private final MotorcycleRepository motorcycleRepository;
    
    /**
     * Compare multiple motorcycles by their IDs
     * Returns detailed comparison data
     */
    public List<Motorcycle> compareMotorcycles(List<String> motorcycleIds) {
        if (motorcycleIds == null || motorcycleIds.isEmpty()) {
            throw new IllegalArgumentException("At least one motorcycle ID is required");
        }
        
        if (motorcycleIds.size() > 4) {
            throw new IllegalArgumentException("Cannot compare more than 4 motorcycles at once");
        }
        
        List<Motorcycle> motorcycles = motorcycleRepository.findAllById(motorcycleIds);
        
        if (motorcycles.isEmpty()) {
            throw new ResourceNotFoundException("No motorcycles found with the provided IDs");
        }
        
        // Return motorcycles in the same order as requested IDs
        Map<String, Motorcycle> motorcycleMap = motorcycles.stream()
            .collect(Collectors.toMap(Motorcycle::getId, m -> m));
        
        return motorcycleIds.stream()
            .map(motorcycleMap::get)
            .filter(Objects::nonNull)
            .collect(Collectors.toList());
    }
    
    /**
     * Get comparison summary with key differences
     */
    public Map<String, Object> getComparisonSummary(List<String> motorcycleIds) {
        List<Motorcycle> motorcycles = compareMotorcycles(motorcycleIds);
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("motorcycles", motorcycles);
        summary.put("count", motorcycles.size());
        
        // Price comparison
        Double minPrice = motorcycles.stream()
            .map(Motorcycle::getPrice)
            .min(Double::compareTo)
            .orElse(0.0);
        Double maxPrice = motorcycles.stream()
            .map(Motorcycle::getPrice)
            .max(Double::compareTo)
            .orElse(0.0);
        
        summary.put("priceRange", Map.of(
            "min", minPrice,
            "max", maxPrice,
            "difference", maxPrice - minPrice
        ));
        
        // Power comparison
        if (motorcycles.stream().anyMatch(m -> m.getPower() != null)) {
            Double minPower = motorcycles.stream()
                .map(Motorcycle::getPower)
                .filter(Objects::nonNull)
                .min(Double::compareTo)
                .orElse(0.0);
            Double maxPower = motorcycles.stream()
                .map(Motorcycle::getPower)
                .filter(Objects::nonNull)
                .max(Double::compareTo)
                .orElse(0.0);
            
            summary.put("powerRange", Map.of(
                "min", minPower,
                "max", maxPower
            ));
        }
        
        // Displacement comparison
        if (motorcycles.stream().anyMatch(m -> m.getDisplacement() != null)) {
            Integer minDisplacement = motorcycles.stream()
                .map(Motorcycle::getDisplacement)
                .filter(Objects::nonNull)
                .min(Integer::compareTo)
                .orElse(0);
            Integer maxDisplacement = motorcycles.stream()
                .map(Motorcycle::getDisplacement)
                .filter(Objects::nonNull)
                .max(Integer::compareTo)
                .orElse(0);
            
            summary.put("displacementRange", Map.of(
                "min", minDisplacement,
                "max", maxDisplacement
            ));
        }
        
        // Brand diversity
        Set<String> brands = motorcycles.stream()
            .map(Motorcycle::getBrand)
            .collect(Collectors.toSet());
        summary.put("brands", brands);
        summary.put("brandCount", brands.size());
        
        // Category diversity
        Set<String> categories = motorcycles.stream()
            .map(Motorcycle::getCategory)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());
        summary.put("categories", categories);
        
        // Average rating
        Double avgRating = motorcycles.stream()
            .map(Motorcycle::getAverageRating)
            .filter(r -> r > 0)
            .mapToDouble(Double::doubleValue)
            .average()
            .orElse(0.0);
        summary.put("averageRating", avgRating);
        
        return summary;
    }
    
    /**
     * Get recommended alternatives based on comparison
     */
    public List<Motorcycle> getAlternatives(List<String> motorcycleIds, int limit) {
        List<Motorcycle> compared = compareMotorcycles(motorcycleIds);
        
        // Get price range
        Double minPrice = compared.stream()
            .map(Motorcycle::getPrice)
            .min(Double::compareTo)
            .orElse(0.0);
        Double maxPrice = compared.stream()
            .map(Motorcycle::getPrice)
            .max(Double::compareTo)
            .orElse(Double.MAX_VALUE);
        
        // Expand price range by 20%
        Double priceBuffer = (maxPrice - minPrice) * 0.2;
        minPrice = Math.max(0, minPrice - priceBuffer);
        maxPrice = maxPrice + priceBuffer;
        
        // Get categories
        Set<String> categories = compared.stream()
            .map(Motorcycle::getCategory)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());
        
        // Find similar motorcycles
        List<Motorcycle> alternatives = motorcycleRepository.findByPriceBetween(minPrice, maxPrice);
        
        // Filter out already compared motorcycles
        Set<String> comparedIds = compared.stream()
            .map(Motorcycle::getId)
            .collect(Collectors.toSet());
        
        return alternatives.stream()
            .filter(m -> !comparedIds.contains(m.getId()))
            .filter(m -> categories.isEmpty() || categories.contains(m.getCategory()))
            .limit(limit)
            .collect(Collectors.toList());
    }
}
