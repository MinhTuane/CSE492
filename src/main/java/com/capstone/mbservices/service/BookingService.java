package com.capstone.mbservices.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.servlet.http.HttpServletRequest;
import com.capstone.mbservices.entity.*;
import com.capstone.mbservices.entity.Notification;
import com.capstone.mbservices.dto.request.*;
import com.capstone.mbservices.enums.*;
import com.capstone.mbservices.exception.ResourceNotFoundException;
import com.capstone.mbservices.repository.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
@RequiredArgsConstructor
public class BookingService {
    private final TestRideRepository testRideRepository;
    private final MaintenanceServiceRepository maintenanceServiceRepository;
    private final UserRepository userRepository;
    private final MotorcycleRepository motorcycleRepository;
    private final StoreRepository storeRepository;
    private final StaffRepository staffRepository;
    private final ReviewRepository reviewRepository;
    private final ServiceOfferingRepository serviceOfferingRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final VNPayService vnPayService;

    @Value("${app.frontend.url:http://localhost:3001}")
    private String frontendUrl;
    
    @Transactional
    public TestRide scheduleTestRide(TestRideRequest request) {
        User user = userRepository.findById(request.getUserId())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        // Pessimistic lock prevents two users from booking the same motorcycle
        // for overlapping time slots simultaneously.
        Motorcycle motorcycle = motorcycleRepository.findByIdForUpdate(request.getMotorcycleId())
            .orElseThrow(() -> new ResourceNotFoundException("Motorcycle not found"));
        Store store = storeRepository.findById(request.getStoreId())
            .orElseThrow(() -> new ResourceNotFoundException("Store not found"));
            
        // Prevent overbooking: Check if there's already a test ride for this motorcycle overlapping the time window
        LocalDateTime start = request.getScheduleDate();
        LocalDateTime end = start.plusMinutes(request.getDuration());
        
        List<TestRide> existingRides = testRideRepository.findByMotorcycleId(motorcycle.getId());
        for (TestRide tr : existingRides) {
            if (tr.getStatus() == TestRideStatus.CANCELLED || tr.getStatus() == TestRideStatus.COMPLETED
                    || tr.getStatus() == TestRideStatus.NO_SHOW || tr.getStatus() == TestRideStatus.EXPIRED) {
                continue;
            }
            LocalDateTime trStart = tr.getScheduleDateTime() != null ? tr.getScheduleDateTime() : tr.getScheduleDate();
            if (trStart == null) continue;
            LocalDateTime trEnd = trStart.plusMinutes(tr.getDuration() != null ? tr.getDuration() : 30);
            
            // Check for overlap: start < trEnd AND end > trStart
            if (start.isBefore(trEnd) && end.isAfter(trStart)) {
                throw new com.capstone.mbservices.exception.BadRequestException("This motorcycle is already booked for a test ride during the requested time. Please choose another time.");
            }
        }
        
        TestRide testRide = TestRide.builder()
            .user(user)
            .motorcycle(motorcycle)
            .scheduleDate(request.getScheduleDate())
            .scheduleDateTime(request.getScheduleDate())
            .duration(request.getDuration())
            .location(store.getName() != null && store.getAddress() != null
                ? (store.getName() + " — " + store.getAddress())
                : (store.getName() != null ? store.getName() : store.getAddress()))
            .notes(request.getNotes())
            .store(store)
            .status(TestRideStatus.PENDING)
            .build();
        
        TestRide savedTestRide = testRideRepository.save(testRide);
        emailService.sendTestRideConfirmationEmail(savedTestRide);

        notificationService.sendToAdmin(
            "New Test Ride",
            "User " + user.getFirstname() + " booked a test ride for " + motorcycle.getModel(),
            "TEST_RIDE",
            savedTestRide.getId()
        );

        return savedTestRide;
    }
    
    @Transactional
    public MaintenanceService scheduleService(ServiceScheduleRequest request) {
        User user = userRepository.findById(request.getUserId())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Motorcycle motorcycle = motorcycleRepository.findById(request.getMotorcycleId())
            .orElseThrow(() -> new ResourceNotFoundException("Motorcycle not found"));
        Store store = storeRepository.findById(request.getStoreId())
            .orElseThrow(() -> new ResourceNotFoundException("Store not found"));
            
        // Prevent overbooking for service slots on this motorcycle
        LocalDateTime start = request.getScheduleDate();
        LocalDateTime end = start.plusHours(1); // Assume services take about 1 hour minimum
        
        List<MaintenanceService> existingServices = maintenanceServiceRepository.findByMotorcycleId(motorcycle.getId());
        for (MaintenanceService ms : existingServices) {
            if (ms.getStatus() == ServiceStatus.CANCELLED || ms.getStatus() == ServiceStatus.COMPLETED
                    || ms.getStatus() == ServiceStatus.EXPIRED) {
                continue;
            }
            LocalDateTime msStart = ms.getScheduleDate();
            if (msStart == null) continue;
            LocalDateTime msEnd = msStart.plusHours(1);
            
            if (start.isBefore(msEnd) && end.isAfter(msStart)) {
                throw new com.capstone.mbservices.exception.BadRequestException("This motorcycle already has a service scheduled during the requested time.");
            }
        }
            
        Double cost = null;
        String bundleId = request.getBundleId();
        if (bundleId != null && !bundleId.isEmpty()) {
            var offeringOpt = serviceOfferingRepository.findById(bundleId);
            if (offeringOpt.isPresent() && offeringOpt.get().getPrice() != null) {
                cost = offeringOpt.get().getPrice().doubleValue();
            }
        } else {
            String type = request.getServiceType();
            if (type != null) {
                var offeringOpt = serviceOfferingRepository.findByNameIgnoreCase(type);
                if (offeringOpt.isPresent() && offeringOpt.get().getPrice() != null) {
                    cost = offeringOpt.get().getPrice().doubleValue();
                    bundleId = offeringOpt.get().getId();
                }
            }
        }
        MaintenanceService service = MaintenanceService.builder()
            .user(user)
            .motorcycle(motorcycle)
            .store(store)
            .serviceType(request.getServiceType())
            .description(request.getDescription())
            .scheduleDate(request.getScheduleDate())
            .notes(request.getNotes())
            .status(ServiceStatus.SCHEDULED)
            .cost(cost)
            .bundleId(bundleId)
            .build();
        
        MaintenanceService savedService = maintenanceServiceRepository.save(service);
        emailService.sendMaintenanceConfirmationEmail(savedService);

        notificationService.sendToAdmin(
            "New Service Booking",
            "User " + user.getFirstname() + " booked a maintenance service",
            "SERVICE",
            savedService.getId()
        );

        return savedService;
    }
    
    public java.util.List<com.capstone.mbservices.entity.ServiceOffering> getActiveServiceOfferings(String storeId) {
        if (storeId != null && !storeId.isBlank()) {
            return serviceOfferingRepository.findByStoreIdAndActiveTrue(storeId);
        }
        return serviceOfferingRepository.findByActiveTrue();
    }
    
    public List<TestRide> getUserTestRides(String userId) {
        return testRideRepository.findByUserIdOrderByScheduleDateTimeDesc(userId);
    }
    
    public List<MaintenanceService> getUserServices(String userId) {
        return maintenanceServiceRepository.findByUserIdOrderByScheduleDateDesc(userId);
    }
    
    public List<Store> getAllStores() {
        return storeRepository.findAll();
    }
    
    public Store getNearestStore(double lat, double lng) {
        List<Store> stores = storeRepository.findAll();
        if (stores.isEmpty()) return null;
        Store best = null;
        double bestDist = Double.MAX_VALUE;
        for (Store s : stores) {
            if (s.getLatitude() == null || s.getLongitude() == null) continue;
            double d = haversine(lat, lng, s.getLatitude(), s.getLongitude());
            if (d < bestDist) {
                bestDist = d;
                best = s;
            }
        }
        return best != null ? best : stores.get(0);
    }
    
    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon/2) * Math.sin(dLon/2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
    
    public Map<String, Object> getServiceStats() {
        long totalServices = maintenanceServiceRepository.count();
        long scheduled = maintenanceServiceRepository.findByStatus(ServiceStatus.SCHEDULED).size();
        long inProgress = maintenanceServiceRepository.findByStatus(ServiceStatus.IN_PROGRESS).size();
        long completed = maintenanceServiceRepository.findByStatus(ServiceStatus.COMPLETED).size();
        long technicianCount = staffRepository.count();
        long totalReviews = reviewRepository.count();
        long approvedReviews = reviewRepository.countByIsApproved(true);
        double satisfactionRate = totalReviews > 0 ? (approvedReviews * 100.0 / totalReviews) : 0.0;
        long motorcyclesServiced = maintenanceServiceRepository.findAll().stream()
            .filter(s -> s.getMotorcycle() != null)
            .map(s -> s.getMotorcycle().getId())
            .distinct()
            .count();
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalServices", totalServices);
        stats.put("scheduled", scheduled);
        stats.put("inProgress", inProgress);
        stats.put("completed", completed);
        stats.put("technicianCount", technicianCount);
        stats.put("satisfactionRate", Math.round(satisfactionRate));
        stats.put("motorcyclesServiced", motorcyclesServiced);
        return stats;
    }
    
    public List<MaintenanceService> getRecentServices(int limit) {
        return maintenanceServiceRepository.findAll().stream()
            .sorted((a, b) -> b.getCreateAt().compareTo(a.getCreateAt()))
            .limit(limit)
            .toList();
    }
    
    public TestRide confirmTestRide(String id) {
        TestRide testRide = testRideRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Test ride not found"));
        testRide.setStatus(TestRideStatus.CONFIRMED);
        testRide.setConfirmedAt(LocalDateTime.now());
        return testRideRepository.save(testRide);
    }
    
    public TestRide confirmAssignedTestRide(String id) {
        TestRide testRide = testRideRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Test ride not found"));
        testRide.setStatus(TestRideStatus.CONFIRMED);
        testRide.setConfirmedAt(LocalDateTime.now());
        testRide.setNotes(appendNote(testRide.getNotes(), "Staff confirmed assignment"));
        return testRideRepository.save(testRide);
    }
    
    public TestRide proposeNewTime(String id, LocalDateTime newDate, String note) {
        TestRide testRide = testRideRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Test ride not found"));
        testRide.setScheduleDate(newDate);
        testRide.setScheduleDateTime(newDate);
        testRide.setProposedDate(newDate);
        testRide.setStatus(TestRideStatus.PENDING);
        testRide.setNotes(appendNote(testRide.getNotes(), note != null ? ("Proposed new time: " + newDate + (note.isEmpty() ? "" : " - " + note)) : ("Proposed new time: " + newDate)));
        return testRideRepository.save(testRide);
    }
    
    public void cancelTestRide(String id) {
        TestRide testRide = testRideRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Test ride not found"));
        testRide.setStatus(TestRideStatus.CANCELLED);
        if (testRide.getDepositStatus() == com.capstone.mbservices.enums.DepositStatus.PAID) {
            testRide.setDepositStatus(com.capstone.mbservices.enums.DepositStatus.REFUNDED);
            notificationService.sendToUser(
                testRide.getUser(),
                "Test Ride Deposit Refund",
                String.format("Appointment cancelled. Deposit of %,.0f VND will be refunded within 3-5 business days.",
                    testRide.getDepositAmount()),
                "TEST_RIDE", testRide.getId()
            );
        }
        testRideRepository.save(testRide);
    }

    public com.capstone.mbservices.dto.response.VNPayResponse createTestRideDepositPayment(
            String testRideId, HttpServletRequest request) {
        TestRide testRide = testRideRepository.findById(testRideId)
            .orElseThrow(() -> new ResourceNotFoundException("Test ride not found"));
        if (testRide.getDepositStatus() == com.capstone.mbservices.enums.DepositStatus.PAID) {
            throw new com.capstone.mbservices.exception.BadRequestException("Deposit already paid for this booking");
        }
        double amount = testRide.getDepositAmount() != null ? testRide.getDepositAmount() : 200_000.0;
        String orderInfo = "Dat coc lich lai thu xe " + testRide.getMotorcycle().getModel();
        String depositReturnUrl = frontendUrl + "/my-bookings?depositResult=pending&testRideId=" + testRideId;
        return vnPayService.createPayment(amount, orderInfo, testRideId, request, depositReturnUrl);
    }

    @Transactional
    public TestRide processTestRideDeposit(String testRideId, String transactionId) {
        TestRide testRide = testRideRepository.findById(testRideId)
            .orElseThrow(() -> new ResourceNotFoundException("Test ride not found"));
        if (testRide.getDepositStatus() == com.capstone.mbservices.enums.DepositStatus.PAID) {
            return testRide;
        }
        testRide.setDepositStatus(com.capstone.mbservices.enums.DepositStatus.PAID);
        testRide.setDepositPaidAt(java.time.LocalDateTime.now());
        testRide.setDepositTransactionId(transactionId);
        if (testRide.getStatus() == TestRideStatus.PENDING) {
            testRide.setStatus(TestRideStatus.CONFIRMED);
            testRide.setConfirmedAt(java.time.LocalDateTime.now());
        }
        TestRide saved = testRideRepository.save(testRide);
        notificationService.sendToAdmin(
            "Deposit Received",
            "User " + saved.getUser().getFirstname() + " paid deposit for test ride booking",
            "TEST_RIDE", saved.getId()
        );
        notificationService.sendToUser(
            saved.getUser(),
            "Deposit Successful",
            String.format("Test ride booking has been confirmed. Deposit of %,.0f VND has been received.",
                saved.getDepositAmount()),
            "TEST_RIDE", saved.getId()
        );
        return saved;
    }

    private String appendNote(String existing, String addition) {
        if (existing == null || existing.isEmpty()) return addition;
        return existing + "\n" + addition;
    }
    
    public List<ServiceOffering> getServiceCatalog() {
        return serviceOfferingRepository.findByActiveTrue();
    }

    /**
     * Returns available booking slots for a given date at a store.
     *
     * @param storeId         target store
     * @param date            the date to check (yyyy-MM-dd)
     * @param type            "TEST_RIDE" or "SERVICE"
     * @param durationMinutes slot length in minutes (default 30)
     * @return list of slot maps with keys: start, end, available
     */
    public List<Map<String, Object>> getAvailableSlots(String storeId, LocalDateTime date, String type, int durationMinutes) {
        // Working hours: 08:00 – 17:00 (last slot must end by 17:00)
        LocalDateTime workStart = date.toLocalDate().atTime(8, 0);
        LocalDateTime workEnd   = date.toLocalDate().atTime(17, 0);

        // Collect all busy intervals at this store on this day
        List<LocalDateTime[]> busyIntervals = new java.util.ArrayList<>();

        if ("SERVICE".equalsIgnoreCase(type)) {
            List<MaintenanceService> services = maintenanceServiceRepository
                .findByStoreIdAndScheduleDateBetween(storeId, workStart, workEnd);
            for (MaintenanceService ms : services) {
                if (ms.getStatus() == ServiceStatus.CANCELLED || ms.getStatus() == ServiceStatus.EXPIRED) continue;
                if (ms.getScheduleDate() == null) continue;
                LocalDateTime sStart = ms.getScheduleDate();
                LocalDateTime sEnd   = sStart.plusMinutes(durationMinutes);
                busyIntervals.add(new LocalDateTime[]{sStart, sEnd});
            }
        } else {
            // Default: TEST_RIDE
            List<TestRide> rides = testRideRepository.findByStoreIdAndScheduleDateTimeBetween(storeId, workStart, workEnd);
            // Also check scheduleDate field
            List<TestRide> rides2 = testRideRepository.findByStoreIdAndScheduleDateBetween(storeId, workStart, workEnd);
            java.util.Set<String> seen = new java.util.HashSet<>();
            for (TestRide r : rides) {
                if (r.getStatus() == TestRideStatus.CANCELLED || r.getStatus() == TestRideStatus.EXPIRED
                        || r.getStatus() == TestRideStatus.NO_SHOW || r.getStatus() == TestRideStatus.COMPLETED) continue;
                seen.add(r.getId());
                LocalDateTime rStart = r.getScheduleDateTime() != null ? r.getScheduleDateTime() : r.getScheduleDate();
                if (rStart == null) continue;
                LocalDateTime rEnd = rStart.plusMinutes(r.getDuration() != null ? r.getDuration() : durationMinutes);
                busyIntervals.add(new LocalDateTime[]{rStart, rEnd});
            }
            for (TestRide r : rides2) {
                if (seen.contains(r.getId())) continue;
                if (r.getStatus() == TestRideStatus.CANCELLED || r.getStatus() == TestRideStatus.EXPIRED
                        || r.getStatus() == TestRideStatus.NO_SHOW || r.getStatus() == TestRideStatus.COMPLETED) continue;
                LocalDateTime rStart = r.getScheduleDate();
                if (rStart == null) continue;
                LocalDateTime rEnd = rStart.plusMinutes(r.getDuration() != null ? r.getDuration() : durationMinutes);
                busyIntervals.add(new LocalDateTime[]{rStart, rEnd});
            }
        }

        List<Map<String, Object>> slots = new java.util.ArrayList<>();
        LocalDateTime cursor = workStart;
        while (!cursor.plusMinutes(durationMinutes).isAfter(workEnd)) {
            LocalDateTime slotEnd = cursor.plusMinutes(durationMinutes);
            boolean available = true;
            for (LocalDateTime[] busy : busyIntervals) {
                // Overlap: slot starts before busy ends AND slot ends after busy starts
                if (cursor.isBefore(busy[1]) && slotEnd.isAfter(busy[0])) {
                    available = false;
                    break;
                }
            }
            Map<String, Object> slot = new java.util.LinkedHashMap<>();
            slot.put("start", cursor.toLocalTime().toString());
            slot.put("end", slotEnd.toLocalTime().toString());
            slot.put("startDateTime", cursor.toString());
            slot.put("available", available);
            slots.add(slot);
            cursor = cursor.plusMinutes(durationMinutes);
        }
        return slots;
    }

    @Transactional
    public int expireTestRides(LocalDateTime now) {
        if (now == null) return 0;
        List<TestRideStatus> statusesToScan = List.of(
            TestRideStatus.PENDING,
            TestRideStatus.SCHEDULED,
            TestRideStatus.CONFIRMED,
            TestRideStatus.AWAITING_STAFF_CONFIRMATION,
            TestRideStatus.RESCHEDULE_REQUESTED
        );
        List<TestRide> toUpdate = new java.util.ArrayList<>();
        for (TestRideStatus s : statusesToScan) {
            List<TestRide> rides = testRideRepository.findByStatus(s);
            if (rides == null) continue;
            for (TestRide r : rides) {
                LocalDateTime start = r.getScheduleDateTime() != null ? r.getScheduleDateTime() : r.getScheduleDate();
                if (start == null) continue;
                int duration = r.getDuration() != null ? r.getDuration() : 30;
                LocalDateTime end = start.plusMinutes(duration);
                if (!end.isBefore(now)) {
                    continue;
                }
                switch (s) {
                    case PENDING, AWAITING_STAFF_CONFIRMATION, RESCHEDULE_REQUESTED -> {
                        r.setStatus(TestRideStatus.EXPIRED);
                        r.setNotes(appendNote(r.getNotes(), "Auto-expired: booking window ended without completion"));
                    }
                    case SCHEDULED, CONFIRMED -> {
                        r.setStatus(TestRideStatus.COMPLETED);
                        r.setNotes(appendNote(r.getNotes(), "Auto-completed: appointment slot ended"));
                    }
                    default -> {
                        // no-op
                    }
                }
                toUpdate.add(r);
            }
        }
        if (toUpdate.isEmpty()) return 0;
        testRideRepository.saveAll(toUpdate);
        return toUpdate.size();
    }

    @Transactional
    public int expireMaintenanceServices(LocalDateTime now) {
        if (now == null) return 0;
        LocalDateTime threshold = now.minusHours(24);
        List<MaintenanceService> services = maintenanceServiceRepository.findByStatusAndScheduleDateBefore(ServiceStatus.SCHEDULED, threshold);
        if (services == null || services.isEmpty()) return 0;
        for (MaintenanceService s : services) {
            s.setStatus(ServiceStatus.EXPIRED);
            s.setNotes(appendNote(s.getNotes(), "Auto-expired: scheduled service was not started within 24h"));
        }
        maintenanceServiceRepository.saveAll(services);
        return services.size();
    }
}
