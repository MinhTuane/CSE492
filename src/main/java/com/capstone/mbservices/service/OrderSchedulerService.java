package com.capstone.mbservices.service;

import com.capstone.mbservices.entity.Accessory;
import com.capstone.mbservices.entity.Motorcycle;
import com.capstone.mbservices.entity.Order;
import com.capstone.mbservices.entity.OrderItem;
import com.capstone.mbservices.enums.ItemType;
import com.capstone.mbservices.enums.MotorcycleStatus;
import com.capstone.mbservices.enums.OrderStatus;
import com.capstone.mbservices.repository.AccessoryRepository;
import com.capstone.mbservices.repository.MotorcycleRepository;
import com.capstone.mbservices.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduled tasks for order lifecycle management.
 * - Auto-cancel PENDING orders that exceed the payment timeout window.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OrderSchedulerService {

    private final OrderRepository orderRepository;
    private final MotorcycleRepository motorcycleRepository;
    private final AccessoryRepository accessoryRepository;
    private final NotificationService notificationService;

    /** How many minutes a PENDING order may sit before being auto-cancelled. */
    @Value("${order.pending-timeout-minutes:30}")
    private int pendingTimeoutMinutes;

    /**
     * Runs every 5 minutes. Finds PENDING orders older than {@code pendingTimeoutMinutes}
     * and cancels them, restoring reserved stock.
     */
    @Scheduled(fixedDelayString = "PT5M")
    @Transactional
    public void cancelExpiredPendingOrders() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(pendingTimeoutMinutes);
        List<Order> expired = orderRepository.findExpiredPendingOrders(cutoff);
        if (expired.isEmpty()) return;

        log.info("[SCHEDULER] Auto-cancelling {} expired PENDING order(s) (timeout={}m).", expired.size(), pendingTimeoutMinutes);

        for (Order order : expired) {
            try {
                order.setStatus(OrderStatus.CANCELLED);
                String note = "Auto-cancelled: payment not completed within " + pendingTimeoutMinutes + " minutes.";
                order.setNotes(order.getNotes() != null ? order.getNotes() + "\n" + note : note);

                // Restore reserved stock for V2 (OrderItem-based) orders.
                // V1 legacy orders never reserve stock at PENDING, so skip them.
                if (order.getOrderItems() != null && !order.getOrderItems().isEmpty()) {
                    for (OrderItem item : order.getOrderItems()) {
                        restoreStock(item);
                    }
                }

                orderRepository.save(order);

                if (order.getUser() != null) {
                    notificationService.sendToUser(
                        order.getUser(),
                        "Order Cancelled",
                        "Your order #" + order.getOrderNumber() + " was cancelled because payment was not completed in time.",
                        "ORDER",
                        order.getId()
                    );
                }

                log.info("[SCHEDULER] Cancelled order={} (created={})", order.getId(), order.getCreateAt());
            } catch (Exception e) {
                log.error("[SCHEDULER] Failed to cancel order={}: {}", order.getId(), e.getMessage(), e);
            }
        }
    }

    private void restoreStock(OrderItem item) {
        if (item.getItemType() == ItemType.MOTORCYCLE) {
            Motorcycle moto = motorcycleRepository.findByIdForUpdate(item.getItemId()).orElse(null);
            if (moto != null) {
                int restored = (moto.getStock() != null ? moto.getStock() : 0) + item.getQuantity();
                moto.setStock(restored);
                if (moto.getStatus() == MotorcycleStatus.OUT_OF_STOCK && restored > 0) {
                    moto.setStatus(MotorcycleStatus.AVAILABLE);
                }
                motorcycleRepository.save(moto);
            }
        } else if (item.getItemType() == ItemType.ACCESSORY) {
            Accessory acc = accessoryRepository.findByIdForUpdate(item.getItemId()).orElse(null);
            if (acc != null) {
                acc.setStock((acc.getStock() != null ? acc.getStock() : 0) + item.getQuantity());
                accessoryRepository.save(acc);
            }
        }
    }
}
