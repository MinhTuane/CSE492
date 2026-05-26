package com.capstone.mbservices.repository;

import com.capstone.mbservices.entity.DiscountCode;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DiscountCodeRepository extends JpaRepository<DiscountCode, String> {
    Optional<DiscountCode> findByCode(String code);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT d FROM DiscountCode d WHERE d.code = :code")
    Optional<DiscountCode> findByCodeForUpdate(@Param("code") String code);
}
