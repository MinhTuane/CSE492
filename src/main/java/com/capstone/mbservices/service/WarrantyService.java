package com.capstone.mbservices.service;

import com.capstone.mbservices.entity.Order;
import com.capstone.mbservices.entity.OrderItem;
import com.capstone.mbservices.entity.Motorcycle;
import com.capstone.mbservices.entity.WarrantyCard;
import com.capstone.mbservices.enums.ItemType;
import com.capstone.mbservices.repository.WarrantyCardRepository;
import com.capstone.mbservices.repository.MotorcycleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WarrantyService {

    private final WarrantyCardRepository warrantyCardRepository;
    private final MotorcycleRepository motorcycleRepository;

    @Transactional
    public void activateWarrantyForOrder(Order order) {
        if (order == null || order.getOrderItems() == null) return;

        for (OrderItem item : order.getOrderItems()) {
            if (item.getItemType() == ItemType.MOTORCYCLE) {
                Motorcycle motorcycle = motorcycleRepository.findById(item.getItemId()).orElse(null);
                if (motorcycle == null) continue;

                // Create Unique Frame and Engine Numbers for the customer's brand-new machine
                String frameNumber = "MBS-FN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
                String engineNumber = "MBS-EN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

                LocalDateTime now = LocalDateTime.now();
                
                WarrantyCard card = WarrantyCard.builder()
                        .motorcycle(motorcycle)
                        .user(order.getUser())
                        .frameNumber(frameNumber)
                        .engineNumber(engineNumber)
                        .startDate(now)
                        .endDate(now.plusYears(3)) // 3-year warranty
                        .qrCodeUrl("https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://mbservices.local/admin/warranty/" + item.getItemId())
                        .build();

                warrantyCardRepository.save(card);
                log.info("🔔 [E-WARRANTY] Activated 3-Year Sổ bảo hành điện tử for Motorcycle: {} {} (Owner: {})", 
                    motorcycle.getBrand(), motorcycle.getModel(), 
                    order.getUser() != null ? order.getUser().getFirstname() : "Guest");
            }
        }
    }
}
