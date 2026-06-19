package com.capstone.mbservices.controller;

import com.capstone.mbservices.entity.StoreInventory;
import com.capstone.mbservices.repository.StoreInventoryRepository;
import com.capstone.mbservices.repository.StoreRepository;
import com.capstone.mbservices.repository.MotorcycleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/inventory")
@RequiredArgsConstructor
public class StoreInventoryController {

    private final StoreInventoryRepository storeInventoryRepository;
    private final StoreRepository storeRepository;
    private final MotorcycleRepository motorcycleRepository;

    @GetMapping("/motorcycle/{motorcycleId}")
    public ResponseEntity<List<StoreInventory>> getInventoryByMotorcycle(@PathVariable String motorcycleId) {
        return ResponseEntity.ok(storeInventoryRepository.findByMotorcycleId(motorcycleId));
    }

    @GetMapping("/store/{storeId}")
    public ResponseEntity<List<StoreInventory>> getInventoryByStore(@PathVariable String storeId) {
        return ResponseEntity.ok(storeInventoryRepository.findByStoreId(storeId));
    }

    @PostMapping("/update")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF_SERVICE', 'STAFF_CS')")
    public ResponseEntity<StoreInventory> updateStock(
            @RequestParam String storeId,
            @RequestParam String motorcycleId,
            @RequestParam Integer stock) {
        
        StoreInventory inventory = storeInventoryRepository.findByStoreIdAndMotorcycleId(storeId, motorcycleId)
                .orElse(StoreInventory.builder()
                        .store(storeRepository.findById(storeId).orElseThrow())
                        .motorcycle(motorcycleRepository.findById(motorcycleId).orElseThrow())
                        .stock(0)
                        .build());
        
        inventory.setStock(stock);
        return ResponseEntity.ok(storeInventoryRepository.save(inventory));
    }
}
