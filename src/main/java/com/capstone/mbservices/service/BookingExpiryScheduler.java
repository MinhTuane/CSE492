package com.capstone.mbservices.service;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class BookingExpiryScheduler {
    private final BookingService bookingService;

    @Scheduled(
        fixedDelayString = "${booking.expiry.fixedDelayMs:300000}",
        initialDelayString = "${booking.expiry.initialDelayMs:60000}"
    )
    public void expireBookings() {
        LocalDateTime now = LocalDateTime.now();
        bookingService.expireTestRides(now);
        bookingService.expireMaintenanceServices(now);
    }
}
