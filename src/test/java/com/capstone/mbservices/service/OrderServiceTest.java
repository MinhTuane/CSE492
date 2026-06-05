package com.capstone.mbservices.service;

import com.capstone.mbservices.entity.*;
import com.capstone.mbservices.enums.UserRole;
import com.capstone.mbservices.enums.ItemType;
import com.capstone.mbservices.repository.*;
import com.capstone.mbservices.dto.request.OrderRequest;
import com.capstone.mbservices.dto.request.OrderItemRequest;
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
    private OrderItemRepository orderItemRepository;
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
    @Mock
    private ZaloPayService zaloPayService;
    @Mock
    private EInvoiceService eInvoiceService;
    @Mock
    private WarrantyService warrantyService;
    @Mock
    private RegistrationDetailsRepository registrationDetailsRepository;

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
        
        OrderItemRequest item1 = new OrderItemRequest();
        item1.setItemType(ItemType.MOTORCYCLE);
        item1.setItemId("moto-1");
        item1.setQuantity(1);
        
        OrderItemRequest item2 = new OrderItemRequest();
        item2.setItemType(ItemType.ACCESSORY);
        item2.setItemId("acc-1");
        item2.setQuantity(1);
        
        request.setItems(List.of(item1, item2));
        request.setPaymentMethod(PaymentMethod.COD);
        request.setShippingAddress("Test Address");
        request.setStoreId("store-1");

        when(userRepository.findById("user-1")).thenReturn(Optional.of(mockUser));
        when(storeRepository.findById("store-1")).thenReturn(Optional.of(new Store()));
        when(motorcycleRepository.findByIdForUpdate("moto-1")).thenReturn(Optional.of(mockMotorcycle));
        when(accessoryRepository.findByIdForUpdate("acc-1")).thenReturn(Optional.of(mockAccessory));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArguments()[0]);

        Order createdOrder = orderService.createOrder(request);

        assertNotNull(createdOrder);
        assertEquals(2, createdOrder.getOrderItems().size());
        verify(orderRepository).save(any(Order.class));
    }

    @Test
    void createOrder_WithLoyaltyPoints_DoesNotDeductUntilPayment() {
        OrderRequest request = new OrderRequest();
        request.setUserId("user-1");
        
        OrderItemRequest item = new OrderItemRequest();
        item.setItemType(ItemType.MOTORCYCLE);
        item.setItemId("moto-1");
        item.setQuantity(1);
        
        request.setItems(List.of(item));
        request.setUseLoyaltyPoints(true);
        request.setPaymentMethod(PaymentMethod.VNPAY);
        request.setShippingAddress("Test Address");
        request.setStoreId("store-1");

        when(userRepository.findById("user-1")).thenReturn(Optional.of(mockUser));
        when(storeRepository.findById("store-1")).thenReturn(Optional.of(new Store()));
        when(motorcycleRepository.findByIdForUpdate("moto-1")).thenReturn(Optional.of(mockMotorcycle));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArguments()[0]);

        Order createdOrder = orderService.createOrder(request);

        assertEquals(2000, mockUser.getLoyaltyPoints());
        assertNotNull(createdOrder.getLoyaltyPointsRedeemed());
        assertEquals(2000, createdOrder.getLoyaltyPointsRedeemed());
        verify(userRepository, never()).save(mockUser);
    }

    @Test
    void processPayment_DeductsLoyaltyWhenReserved() {
        OrderItem orderItem = OrderItem.builder()
                .itemType(ItemType.MOTORCYCLE)
                .itemId("moto-1")
                .quantity(1)
                .build();
        Order order = Order.builder()
                .id("ord-1")
                .orderNumber("ORD-1")
                .user(mockUser)
                .orderItems(List.of(orderItem))
                .status(com.capstone.mbservices.enums.OrderStatus.PENDING)
                .useLoyaltyPoints(true)
                .loyaltyPointsRedeemed(2000)
                .paymentSettlementDone(false)
                .build();

        when(orderRepository.findByIdForUpdate("ord-1")).thenReturn(Optional.of(order));
        when(userRepository.findById("user-1")).thenReturn(Optional.of(mockUser));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArguments()[0]);

        Order paid = orderService.processPayment("ord-1", "TX-1");

        assertEquals(com.capstone.mbservices.enums.OrderStatus.PAID, paid.getStatus());
        assertEquals(0, mockUser.getLoyaltyPoints());
        verify(userRepository).save(mockUser);
    }
}
