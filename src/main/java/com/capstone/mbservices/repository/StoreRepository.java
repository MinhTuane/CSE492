package com.capstone.mbservices.repository;

import com.capstone.mbservices.entity.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface StoreRepository extends JpaRepository<Store, String> {
    Optional<Store> findByName(String name);
}
