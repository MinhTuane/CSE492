package com.capstone.mbservices.service;

import com.capstone.mbservices.entity.*;
import com.capstone.mbservices.dto.request.ServiceScheduleRequest;
import com.capstone.mbservices.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import com.capstone.mbservices.enums.ServiceStatus;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private MaintenanceServiceRepository serviceRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private MotorcycleRepository motorcycleRepository;
    @Mock
    private StoreRepository storeRepository;
    @Mock
    private EmailService emailService;
    @Mock
    private ServiceOfferingRepository serviceOfferingRepository;
    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private BookingService bookingService;

    private User mockUser;
    private Store mockStore;
    private ServiceScheduleRequest mockRequest;

    @BeforeEach
    void setUp() {
        mockUser = new User();
        mockUser.setId("u-1");
        mockUser.setEmail("test@domain.com");

        mockStore = new Store();
        mockStore.setId("s-1");
        mockStore.setName("Main Branch");

        mockRequest = new ServiceScheduleRequest();
        mockRequest.setUserId("u-1");
        mockRequest.setStoreId("s-1");
        mockRequest.setMotorcycleId("moto-1");
        mockRequest.setScheduleDate(LocalDateTime.now().plusDays(2));
        mockRequest.setServiceType("Basic Oil Change");
        mockRequest.setDescription("Needs oil change and chain clean");
    }

    @Test
    void scheduleService_Success() {
        when(userRepository.findById("u-1")).thenReturn(Optional.of(mockUser));
        when(storeRepository.findById("s-1")).thenReturn(Optional.of(mockStore));
        when(motorcycleRepository.findById("moto-1")).thenReturn(Optional.of(new Motorcycle()));
        when(serviceOfferingRepository.findByNameIgnoreCase(anyString())).thenReturn(Optional.of(new ServiceOffering()));
        when(serviceRepository.save(any(MaintenanceService.class))).thenAnswer(i -> {
            MaintenanceService savedService = (MaintenanceService) i.getArguments()[0];
            savedService.setId("srv-1");
            return savedService;
        });

        MaintenanceService result = bookingService.scheduleService(mockRequest);

        assertNotNull(result);
        assertEquals("srv-1", result.getId());
        assertEquals(ServiceStatus.SCHEDULED, result.getStatus());
        assertEquals("Basic Oil Change", result.getServiceType());
        
        verify(serviceRepository, times(1)).save(any(MaintenanceService.class));
        verify(emailService, times(1)).sendMaintenanceConfirmationEmail(any(MaintenanceService.class));
    }

    @Test
    void scheduleService_UserNotFound_ThrowsException() {
        when(userRepository.findById("invalid")).thenReturn(Optional.empty());
        mockRequest.setUserId("invalid");

        Exception exception = assertThrows(RuntimeException.class, () -> {
            bookingService.scheduleService(mockRequest);
        });

        assertTrue(exception.getMessage().contains("User not found"));
        verify(serviceRepository, never()).save(any(MaintenanceService.class));
    }
}
