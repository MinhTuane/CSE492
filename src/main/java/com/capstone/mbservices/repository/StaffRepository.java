package com.capstone.mbservices.repository;

import com.capstone.mbservices.entity.Staff;
import com.capstone.mbservices.entity.User;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface StaffRepository extends JpaRepository<Staff, String> {
    Optional<Staff> findByUserId(String userId);

    boolean existsByUser(User user);

    List<Staff> findByStoreId(String storeId);

    List<Staff> findByStoreIsNull();
}
