package com.capstone.mbservices.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.capstone.mbservices.entity.Motorcycle;
import com.capstone.mbservices.service.ComparisonService;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/comparison")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ComparisonController {
    
    private final ComparisonService comparisonService;
    
    /**
     * Compare motorcycles by IDs
     * POST /api/comparison/compare
     * Body: ["id1", "id2", "id3"]
     * 
     * Example: 
     * POST /api/comparison/compare
     * ["abc-123", "def-456", "ghi-789"]
     */
    @PostMapping("/compare")
    public ResponseEntity<List<Motorcycle>> compareMotorcycles(@RequestBody List<String> motorcycleIds) {
        List<Motorcycle> motorcycles = comparisonService.compareMotorcycles(motorcycleIds);
        return ResponseEntity.ok(motorcycles);
    }
    
    /**
     * Get detailed comparison summary with statistics
     * POST /api/comparison/summary
     * Body: ["id1", "id2", "id3"]
     * 
     * Returns comparison data with price ranges, power ranges, etc.
     */
    @PostMapping("/summary")
    public ResponseEntity<Map<String, Object>> getComparisonSummary(@RequestBody List<String> motorcycleIds) {
        Map<String, Object> summary = comparisonService.getComparisonSummary(motorcycleIds);
        return ResponseEntity.ok(summary);
    }
    
    /**
     * Get alternative motorcycles based on comparison
     * POST /api/comparison/alternatives?limit=5
     * Body: ["id1", "id2"]
     * 
     * Returns similar motorcycles that might interest the user
     */
    @PostMapping("/alternatives")
    public ResponseEntity<List<Motorcycle>> getAlternatives(
            @RequestBody List<String> motorcycleIds,
            @RequestParam(defaultValue = "5") int limit) {
        
        List<Motorcycle> alternatives = comparisonService.getAlternatives(motorcycleIds, limit);
        return ResponseEntity.ok(alternatives);
    }
    
    /**
     * Quick comparison (GET method for simple use cases)
     * GET /api/comparison?ids=id1,id2,id3
     * 
     * For direct URL linking to comparison
     */
    @GetMapping
    public ResponseEntity<List<Motorcycle>> quickCompare(@RequestParam List<String> ids) {
        List<Motorcycle> motorcycles = comparisonService.compareMotorcycles(ids);
        return ResponseEntity.ok(motorcycles);
    }
}
