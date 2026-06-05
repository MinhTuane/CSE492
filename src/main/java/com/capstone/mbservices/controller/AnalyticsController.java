package com.capstone.mbservices.controller;

import com.capstone.mbservices.repository.OrderRepository;
import com.capstone.mbservices.repository.MotorcycleRepository;
import com.capstone.mbservices.repository.UserRepository;
import com.capstone.mbservices.enums.OrderStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/admin/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final OrderRepository orderRepository;
    private final MotorcycleRepository motorcycleRepository;
    private final UserRepository userRepository;

    @GetMapping("/revenue-summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> getRevenueSummary() {
        long totalSales = orderRepository.countByStatus(OrderStatus.PAID);
        Double totalRevenue = orderRepository.calculateTotalRevenue();
        long totalMotorcycles = motorcycleRepository.count();
        long totalCustomers = userRepository.count();

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalSales", totalSales);
        summary.put("totalRevenue", totalRevenue != null ? totalRevenue : 0.0);
        summary.put("totalMotorcycles", totalMotorcycles);
        summary.put("totalCustomers", totalCustomers);
        summary.put("activeStores", 3);

        return ResponseEntity.ok(summary);
    }
}
