package com.capstone.mbservices.repository;

import com.capstone.mbservices.entity.StoreInventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StoreInventoryRepository extends JpaRepository<StoreInventory, String> {
    List<StoreInventory> findByMotorcycleId(String motorcycleId);
    List<StoreInventory> findByStoreId(String storeId);
    Optional<StoreInventory> findByStoreIdAndMotorcycleId(String storeId, String motorcycleId);
}
