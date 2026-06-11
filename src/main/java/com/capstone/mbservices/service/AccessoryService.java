package com.capstone.mbservices.service;

import com.capstone.mbservices.entity.Accessory;
import com.capstone.mbservices.exception.ResourceNotFoundException;
import com.capstone.mbservices.repository.AccessoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AccessoryService {
    private final AccessoryRepository accessoryRepository;

    public List<Accessory> getAllActiveAccessories() {
        return accessoryRepository.findByIsActiveTrue();
    }

    public Page<Accessory> searchAccessories(String keyword, Pageable pageable) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return accessoryRepository.findAll(pageable);
        }
        return accessoryRepository.searchAccessories(keyword, pageable);
    }

    public Accessory getAccessoryById(String id) {
        return accessoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Accessory not found with id: " + id));
    }

    public Accessory createAccessory(Accessory accessory) {
        return accessoryRepository.save(accessory);
    }

    public Accessory updateAccessory(String id, Accessory accessoryDetails) {
        Accessory accessory = getAccessoryById(id);
        accessory.setName(accessoryDetails.getName());
        accessory.setDescription(accessoryDetails.getDescription());
        accessory.setPrice(accessoryDetails.getPrice());
        accessory.setStock(accessoryDetails.getStock());
        accessory.setCategory(accessoryDetails.getCategory());
        accessory.setBrand(accessoryDetails.getBrand());
        accessory.setImageUrl(accessoryDetails.getImageUrl());
        accessory.setCompatibleBikes(accessoryDetails.getCompatibleBikes());
        accessory.setIsActive(accessoryDetails.getIsActive());
        return accessoryRepository.save(accessory);
    }

    public void deleteAccessory(String id) {
        Accessory accessory = getAccessoryById(id);
        accessory.setIsActive(false);
        accessoryRepository.save(accessory);
    }
}
