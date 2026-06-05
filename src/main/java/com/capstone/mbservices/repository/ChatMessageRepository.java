package com.capstone.mbservices.repository;

import com.capstone.mbservices.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, String> {
    
    List<ChatMessage> findByCustomerIdOrderByCreateAtAsc(String customerId);

    @Query("SELECT m.customerId FROM ChatMessage m GROUP BY m.customerId ORDER BY MAX(m.createAt) DESC")
    List<String> findActiveCustomerIds();
}
