package com.capstone.mbservices.repository;

import com.capstone.mbservices.entity.Motorcycle;
import com.capstone.mbservices.enums.MotorcycleStatus;

import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface MotorcycleRepository extends JpaRepository<Motorcycle, String> {
    List<Motorcycle> findByBrandContainingIgnoreCase(String brand);

    List<Motorcycle> findByCategory(String category);

    List<Motorcycle> findByStatus(MotorcycleStatus status);

    List<Motorcycle> findByPriceBetween(Double minPrice, Double maxPrice);

    @Query("SELECT DISTINCT m.brand FROM Motorcycle m ORDER BY m.brand")
    List<String> findAllBrands();

    @Query("SELECT DISTINCT m.category FROM Motorcycle m ORDER BY m.category")
    List<String> findAllCategories();

    @Query("SELECT m FROM Motorcycle m WHERE " +
            "(:brand IS NULL OR m.brand = :brand) AND " +
            "(:category IS NULL OR m.category = :category) AND " +
            "(:minPrice IS NULL OR m.price >= :minPrice) AND " +
            "(:maxPrice IS NULL OR m.price <= :maxPrice) AND " +
            "(:year IS NULL OR m.year = :year) AND " +
            "m.status = 'AVAILABLE'")
    List<Motorcycle> searchMotorcycles(
            @Param("brand") String brand,
            @Param("category") String category,
            @Param("minPrice") Double minPrice,
            @Param("maxPrice") Double maxPrice,
            @Param("year") Integer year);

    @Query("SELECT m FROM Motorcycle m WHERE " +
            "(:brand IS NULL OR m.brand = :brand) AND " +
            "(:category IS NULL OR m.category = :category) AND " +
            "(:minPrice IS NULL OR m.price >= :minPrice) AND " +
            "(:maxPrice IS NULL OR m.price <= :maxPrice) AND " +
            "(:year IS NULL OR m.year = :year) AND " +
            "(:status IS NULL OR m.status = :status) AND " +
            "(:keyword IS NULL OR LOWER(m.brand) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(m.model) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(m.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Motorcycle> searchMotorcyclesPaged(
            @Param("brand") String brand,
            @Param("category") String category,
            @Param("minPrice") Double minPrice,
            @Param("maxPrice") Double maxPrice,
            @Param("year") Integer year,
            @Param("status") MotorcycleStatus status,
            @Param("keyword") String keyword,
            Pageable pageable);

    List<Motorcycle> findByStockLessThan(int threshold);

    Page<Motorcycle> findByModelContainingIgnoreCaseOrBrandContainingIgnoreCase(
            String model, String brand, Pageable pageable);

    Page<Motorcycle> findByBrandAndStatus(String brand, MotorcycleStatus status, Pageable pageable);

    Page<Motorcycle> findByBrand(String brand, Pageable pageable);

    Page<Motorcycle> findByStatus(MotorcycleStatus status, Pageable pageable);

    /**
     * Acquire pessimistic write lock on a motorcycle row to serialize
     * concurrent booking / stock-update operations.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT m FROM Motorcycle m WHERE m.id = :id")
    Optional<Motorcycle> findByIdForUpdate(@Param("id") String id);
}
