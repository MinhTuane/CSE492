package com.capstone.mbservices.repository;

import com.capstone.mbservices.entity.Order;
import com.capstone.mbservices.entity.User;
import com.capstone.mbservices.enums.OrderStatus;

import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, String> {
    List<Order> findByUserId(String userId);

    Optional<Order> findByOrderNumber(String orderNumber);

    List<Order> findByStatus(OrderStatus status);

    List<Order> findByUserIdOrderByCreateAtDesc(String userId);

    long countByStatus(OrderStatus status);

    List<Order> findByCreateAtAfterAndStatus(LocalDateTime date, OrderStatus status);
    
    List<Order> findByCreateAtAfter(LocalDateTime date);

    Page<Order> findByOrderNumberContainingIgnoreCase(String search, Pageable pageable);

    Page<Order> findByStatus(OrderStatus status, Pageable pageable);
    
    Page<Order> findByStoreId(String storeId, Pageable pageable);
    Page<Order> findByStoreIdAndStatus(String storeId, OrderStatus status, Pageable pageable);
    Page<Order> findByStoreIdAndOrderNumberContainingIgnoreCase(String storeId, String search, Pageable pageable);
    List<Order> findByStoreId(String storeId);

    List<Order> findByUser(User user);
    
    boolean existsByTransactionId(String transactionId);

    /**
     * Lock the order row to prevent concurrent payment processing
     * (e.g. multiple gateway callbacks racing).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM Order o WHERE o.id = :id")
    Optional<Order> findByIdForUpdate(@Param("id") String id);
}
