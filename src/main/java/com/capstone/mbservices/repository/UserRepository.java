package com.capstone.mbservices.repository;

import com.capstone.mbservices.entity.User;
import com.capstone.mbservices.enums.UserRole;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);
    
    Optional<User> findByUsername(String username);

    boolean existsByEmail(String email);
    
    boolean existsByUsername(String username);

    List<User> findByRole(UserRole role);

    List<User> findByIsActiveTrue();

    Page<User> findByEmailContainingIgnoreCaseOrFirstnameContainingIgnoreCaseOrLastnameContainingIgnoreCase(
            String email, String firstname, String lastname, Pageable pageable);

    Page<User> findByRole(UserRole role, Pageable pageable);
}
