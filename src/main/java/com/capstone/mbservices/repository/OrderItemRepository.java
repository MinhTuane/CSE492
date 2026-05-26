package com.capstone.mbservices.repository;

import com.capstone.mbservices.entity.OrderItem;
import com.capstone.mbservices.enums.ItemType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, String> {
    
    List<OrderItem> findByOrderId(String orderId);
    
    List<OrderItem> findByOrderIdAndItemType(String orderId, ItemType itemType);
    
    List<OrderItem> findByItemIdAndItemType(String itemId, ItemType itemType);
}
