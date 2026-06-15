package com.capstone.mbservices.dto.response;

import java.util.List;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DashboardResponse {
    private Long totalUsers;
    private Long totalMotorcycles;
    private Long totalOrders;
    private Long totalRevenue;
    private Long pendingOrders;
    private Long activeTestRides;
    private Long scheduledServices;
    private List<Object> recentOrders;
    private List<Object> popularMotorcycles;
    private List<Object> revenueData; // Monthly revenue data field
    private Long lowStockCount;
    private Long pendingTestRides;
    private Long pendingReviews;
}
