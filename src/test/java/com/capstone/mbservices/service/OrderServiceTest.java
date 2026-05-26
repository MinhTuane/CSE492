package com.capstone.mbservices.service;

import com.capstone.mbservices.entity.*;
import com.capstone.mbservices.enums.UserRole;
import com.capstone.mbservices.repository.*;
import com.capstone.mbservices.dto.request.OrderRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import com.capstone.mbservices.enums.PaymentMethod;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private MotorcycleRepository motorcycleRepository;
    @Mock
    private AccessoryRepository accessoryRepository;
    @Mock
    private StoreRepository storeRepository;
    @Mock
    private EmailService emailService;
    @Mock
    private WebhookService webhookService;
    @Mock
    private NotificationService notificationService;
    @Mock
    private DiscountCodeService discountCodeService;

    @InjectMocks
    private OrderService orderService;

    private User mockUser;
    private Motorcycle mockMotorcycle;
    private Accessory mockAccessory;

    @BeforeEach
    void setUp() {
        mockUser = new User();
        mockUser.setId("user-1");
        mockUser.setEmail("test@test.com");
        mockUser.setUsername("testuser");
        mockUser.setAuthProvider("LOCAL");
        mockUser.setHasLocalCredentials(true);
        mockUser.setFirstname("Test");
        mockUser.setLastname("User");
        mockUser.setPhone("0123456789");
        mockUser.setAddress("123 Test Street");
        mockUser.setLoyaltyPoints(2000);

        mockMotorcycle = new Motorcycle();
        mockMotorcycle.setId("moto-1");
        mockMotorcycle.setModel("TestBike");
        mockMotorcycle.setPrice(100_000_000.0);
        mockMotorcycle.setDiscountPercentage(10.0);
        mockMotorcycle.setStock(5);

        mockAccessory = new Accessory();
        mockAccessory.setId("acc-1");
        mockAccessory.setName("Helmet");
        mockAccessory.setPrice(5_000_000.0);
        mockAccessory.setStock(10);
    }

    @Test
    void createOrder_Success_WithMotorcycleAndAccessory() {
        OrderRequest request = new OrderRequest();
        request.setUserId("user-1");
        request.setMotorcycleIds(List.of("moto-1"));
        request.setAccessoryIds(List.of("acc-1"));
        request.setPaymentMethod(PaymentMethod.COD);
        request.setShippingAddress("Test Address");
        request.setStoreId("store-1");

        when(userRepository.findById("user-1")).thenReturn(Optional.of(mockUser));
        when(storeRepository.findById("store-1")).thenReturn(Optional.of(new Store()));
        when(motorcycleRepository.findAllById(any())).thenReturn(List.of(mockMotorcycle));
        when(accessoryRepository.findAllById(any())).thenReturn(List.of(mockAccessory));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArguments()[0]);

        Order createdOrder = orderService.createOrder(request);

        assertNotNull(createdOrder);
        assertEquals(1, createdOrder.getMotorcycles().size());
        assertEquals(1, createdOrder.getAccessories().size());
        verify(orderRepository).save(any(Order.class));
    }

    @Test
    void createOrder_WithLoyaltyPoints_DoesNotDeductUntilPayment() {
        OrderRequest request = new OrderRequest();
        request.setUserId("user-1");
        request.setMotorcycleIds(List.of("moto-1"));
        request.setUseLoyaltyPoints(true);
        request.setPaymentMethod(PaymentMethod.VNPAY);
        request.setShippingAddress("Test Address");
        request.setStoreId("store-1");

        when(userRepository.findById("user-1")).thenReturn(Optional.of(mockUser));
        when(storeRepository.findById("store-1")).thenReturn(Optional.of(new Store()));
        when(motorcycleRepository.findAllById(any())).thenReturn(List.of(mockMotorcycle));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArguments()[0]);

        Order createdOrder = orderService.createOrder(request);

        assertEquals(2000, mockUser.getLoyaltyPoints());
        assertNotNull(createdOrder.getLoyaltyPointsRedeemed());
        assertEquals(2000, createdOrder.getLoyaltyPointsRedeemed());
        verify(userRepository, never()).save(mockUser);
    }

    @Test
    void processPayment_DeductsLoyaltyWhenReserved() {
        Order order = Order.builder()
                .id("ord-1")
                .orderNumber("ORD-1")
                .user(mockUser)
                .motorcycles(List.of(mockMotorcycle))
                .status(com.capstone.mbservices.enums.OrderStatus.PENDING)
                .useLoyaltyPoints(true)
                .loyaltyPointsRedeemed(2000)
                .paymentSettlementDone(false)
                .build();

        when(orderRepository.findById("ord-1")).thenReturn(Optional.of(order));
        when(userRepository.findById("user-1")).thenReturn(Optional.of(mockUser));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArguments()[0]);

        Order paid = orderService.processPayment("ord-1", "TX-1");

        assertEquals(com.capstone.mbservices.enums.OrderStatus.PAID, paid.getStatus());
        assertEquals(0, mockUser.getLoyaltyPoints());
        verify(userRepository).save(mockUser);
    }
}
