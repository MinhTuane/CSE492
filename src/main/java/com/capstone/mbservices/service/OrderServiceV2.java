package com.capstone.mbservices.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.capstone.mbservices.entity.*;
import com.capstone.mbservices.dto.request.OrderRequest;
import com.capstone.mbservices.dto.request.OrderItemRequest;
import com.capstone.mbservices.enums.*;
import com.capstone.mbservices.exception.BadRequestException;
import com.capstone.mbservices.exception.ResourceNotFoundException;
import com.capstone.mbservices.repository.*;
import com.capstone.mbservices.utils.MoneyUtil;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * New OrderService with OrderItem support for proper quantity handling
 */
@Service
@RequiredArgsConstructor
public class OrderServiceV2 {
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final MotorcycleRepository motorcycleRepository;
    private final AccessoryRepository accessoryRepository;
    private final StoreRepository storeRepository;
    private final EmailService emailService;
    private final WebhookService webhookService;
    private final NotificationService notificationService;
    private final DiscountCodeService discountCodeService;

    private static final String PLACEHOLDER_EMAIL_DOMAIN = "@mbservices.local";

    @Transactional
    public Order createOrderWithItems(OrderRequest request) {
        // Validate user profile
        User user = userRepository.findById(request.getUserId())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        validateUserProfile(user);

        // Validate items and check stock
        List<OrderItem> orderItems = new ArrayList<>();
        double totalAmount = 0.0;

        for (OrderItemRequest itemReq : request.getItems()) {
            OrderItem orderItem = createOrderItem(itemReq);
            orderItems.add(orderItem);
            totalAmount += orderItem.getTotalPrice();
        }

        if (orderItems.isEmpty()) {
            throw new BadRequestException("Order must contain at least one item");
        }

        // Calculate fees and discounts
        double taxAmount = MoneyUtil.roundVndDouble(totalAmount * 0.1);
        double shippingFee = MoneyUtil.roundVndDouble(100000.0);
        double discountAmount = 0.0;
        String discountCodeUsed = null;

        // Apply discount code
        if (request.getDiscountCode() != null && !request.getDiscountCode().trim().isEmpty()) {
            try {
                DiscountCode code = discountCodeService.validateDiscountCode(request.getDiscountCode());
                discountAmount = (totalAmount + taxAmount) * (code.getDiscountPercentage() / 100.0);
                if (code.getMaxDiscountAmount() != null && discountAmount > code.getMaxDiscountAmount()) {
                    discountAmount = code.getMaxDiscountAmount();
                }
                discountCodeUsed = code.getCode();
            } catch (BadRequestException e) {
                throw e;
            }
        }

        Store store = storeRepository.findById(request.getStoreId())
            .orElseThrow(() -> new ResourceNotFoundException("Store not found"));

        double finalAmount = (totalAmount + taxAmount + shippingFee) - discountAmount;

        // Apply membership tier discount
        if (user.getMembershipTier() != null) {
            double tierDiscount = calculateTierDiscount(user.getMembershipTier(), finalAmount);
            finalAmount -= tierDiscount;
            discountAmount += tierDiscount;
        }

        // Apply loyalty points
        Integer loyaltyPointsRedeemed = null;
        if (Boolean.TRUE.equals(request.getUseLoyaltyPoints())) {
            if (user.getLoyaltyPoints() != null && user.getLoyaltyPoints() >= 1000) {
                loyaltyPointsRedeemed = (user.getLoyaltyPoints() / 1000) * 1000;
                double pointsDiscount = (loyaltyPointsRedeemed / 1000) * 100000.0;
                if (pointsDiscount > finalAmount) {
                    pointsDiscount = finalAmount;
                }
                finalAmount -= pointsDiscount;
                discountAmount += pointsDiscount;
            }
        }

        finalAmount = MoneyUtil.roundVndDouble(finalAmount);
        discountAmount = MoneyUtil.roundVndDouble(discountAmount);

        // Calculate deposit if needed
        Boolean isDeposit = request.getIsDeposit() != null ? request.getIsDeposit() : false;
        double depositAmount = isDeposit ? MoneyUtil.roundVndDouble(finalAmount * 0.1) : finalAmount;
        double remainingAmount = isDeposit ? MoneyUtil.roundVndDouble(finalAmount - depositAmount) : 0.0;

        // Create order
        Order order = Order.builder()
            .orderNumber("ORD-" + System.currentTimeMillis())
            .user(user)
            .orderItems(new ArrayList<>()) // Will be set after save
            .totalAmount(finalAmount)
            .taxAmount(taxAmount)
            .shippingFee(shippingFee)
            .discountAmount(discountAmount)
            .discountCode(discountCodeUsed)
            .loyaltyPointsRedeemed(loyaltyPointsRedeemed)
            .paymentSettlementDone(false)
            .useLoyaltyPoints(request.getUseLoyaltyPoints() != null ? request.getUseLoyaltyPoints() : false)
            .isDeposit(isDeposit)
            .depositAmount(depositAmount)
            .remainingAmount(remainingAmount)
            .paymentMethod(request.getPaymentMethod())
            .shippingAddress(request.getShippingAddress())
            .notes(request.getNotes())
            .status(OrderStatus.PENDING)
            .store(store)
            .build();

        Order savedOrder = orderRepository.save(order);

        // Save order items
        for (OrderItem item : orderItems) {
            item.setOrder(savedOrder);
        }
        orderItemRepository.saveAll(orderItems);
        savedOrder.setOrderItems(orderItems);

        emailService.sendOrderConfirmationEmail(savedOrder);

        notificationService.sendToAdmin(
            "New Order Received",
            "Order #" + savedOrder.getOrderNumber() + " placed by " + user.getFirstname(),
            "ORDER",
            savedOrder.getId()
        );

        return savedOrder;
    }

    private OrderItem createOrderItem(OrderItemRequest itemReq) {
        if (itemReq.getItemType() == ItemType.MOTORCYCLE) {
            return createMotorcycleOrderItem(itemReq);
        } else if (itemReq.getItemType() == ItemType.ACCESSORY) {
            return createAccessoryOrderItem(itemReq);
        } else {
            throw new BadRequestException("Invalid item type: " + itemReq.getItemType());
        }
    }

    private OrderItem createMotorcycleOrderItem(OrderItemRequest itemReq) {
        // Lock motorcycle row to safely check & deduct stock atomically
        Motorcycle motorcycle = motorcycleRepository.findByIdForUpdate(itemReq.getItemId())
            .orElseThrow(() -> new ResourceNotFoundException("Motorcycle not found: " + itemReq.getItemId()));

        // Check stock
        int availableStock = motorcycle.getStock() != null ? motorcycle.getStock() : 0;
        if (availableStock < itemReq.getQuantity()) {
            throw new BadRequestException("Insufficient stock for motorcycle: " + motorcycle.getModel() + 
                ". Available: " + availableStock + ", Requested: " + itemReq.getQuantity());
        }

        // Reserve stock immediately to prevent oversell while order sits in PENDING
        int newStock = availableStock - itemReq.getQuantity();
        motorcycle.setStock(newStock);
        if (newStock <= 0) {
            motorcycle.setStatus(MotorcycleStatus.OUT_OF_STOCK);
        }
        motorcycleRepository.save(motorcycle);

        // Calculate price
        double originalPrice = motorcycle.getPrice();
        double unitPrice = originalPrice;
        Double discountPercentage = motorcycle.getDiscountPercentage();

        if (discountPercentage != null && discountPercentage > 0) {
            unitPrice = originalPrice * (1 - discountPercentage / 100);
        }

        double totalPrice = unitPrice * itemReq.getQuantity();

        return OrderItem.builder()
            .itemType(ItemType.MOTORCYCLE)
            .itemId(motorcycle.getId())
            .quantity(itemReq.getQuantity())
            .unitPrice(unitPrice)
            .totalPrice(totalPrice)
            .originalUnitPrice(originalPrice)
            .discountPercentage(discountPercentage)
            .itemName(motorcycle.getModel())
            .itemBrand(motorcycle.getBrand())
            .itemModel(motorcycle.getModel())
            .itemCategory(motorcycle.getCategory())
            .itemImageUrl(motorcycle.getImages() != null && !motorcycle.getImages().isEmpty() ? 
                motorcycle.getImages().get(0) : null)
            .build();
    }

    private OrderItem createAccessoryOrderItem(OrderItemRequest itemReq) {
        Accessory accessory = accessoryRepository.findById(itemReq.getItemId())
            .orElseThrow(() -> new ResourceNotFoundException("Accessory not found: " + itemReq.getItemId()));

        // Check stock
        int availableStock = accessory.getStock() != null ? accessory.getStock() : 0;
        if (availableStock < itemReq.getQuantity()) {
            throw new BadRequestException("Insufficient stock for accessory: " + accessory.getName() + 
                ". Available: " + availableStock + ", Requested: " + itemReq.getQuantity());
        }

        double unitPrice = accessory.getPrice() != null ? accessory.getPrice() : 0.0;
        double totalPrice = unitPrice * itemReq.getQuantity();

        return OrderItem.builder()
            .itemType(ItemType.ACCESSORY)
            .itemId(accessory.getId())
            .quantity(itemReq.getQuantity())
            .unitPrice(unitPrice)
            .totalPrice(totalPrice)
            .originalUnitPrice(unitPrice)
            .itemName(accessory.getName())
            .itemBrand(accessory.getBrand())
            .itemCategory(accessory.getCategory())
            .itemImageUrl(accessory.getImageUrl())
            .build();
    }

    @Transactional
    public void applyDeliveredInventoryAndLoyalty(Order order) {
        if (order.getOrderItems() == null || order.getOrderItems().isEmpty()) {
            return;
        }

        // NOTE: Stock was already reserved at order creation (PENDING).
        // Do NOT deduct stock again here to avoid double-deduction.

        // Add loyalty points
        User user = order.getUser();
        if (user != null && order.getTotalAmount() != null) {
            long pointsToAdd = MoneyUtil.roundVnd(order.getTotalAmount()) / 100_000L;
            int newPoints = (user.getLoyaltyPoints() != null ? user.getLoyaltyPoints() : 0) + (int) pointsToAdd;
            user.setLoyaltyPoints(newPoints);

            // Update membership tier (upgrade only, never downgrade on redemption)
            MembershipTier current = user.getMembershipTier() != null ? user.getMembershipTier() : MembershipTier.BRONZE;
            MembershipTier earned;
            if (newPoints >= 5000) earned = MembershipTier.PLATINUM;
            else if (newPoints >= 2000) earned = MembershipTier.GOLD;
            else if (newPoints >= 500) earned = MembershipTier.SILVER;
            else earned = MembershipTier.BRONZE;
            if (earned.ordinal() > current.ordinal()) {
                user.setMembershipTier(earned);
            }

            userRepository.save(user);
        }
    }

    private void deductMotorcycleStock(OrderItem item) {
        Motorcycle motorcycle = motorcycleRepository.findById(item.getItemId()).orElse(null);
        if (motorcycle == null) return;

        int currentStock = motorcycle.getStock() != null ? motorcycle.getStock() : 0;
        int newStock = Math.max(currentStock - item.getQuantity(), 0);
        motorcycle.setStock(newStock);

        if (newStock <= 0) {
            motorcycle.setStatus(MotorcycleStatus.OUT_OF_STOCK);
        } else if (motorcycle.getStatus() == MotorcycleStatus.OUT_OF_STOCK) {
            motorcycle.setStatus(MotorcycleStatus.AVAILABLE);
        }

        motorcycleRepository.save(motorcycle);
    }

    private void deductAccessoryStock(OrderItem item) {
        Accessory accessory = accessoryRepository.findById(item.getItemId()).orElse(null);
        if (accessory == null) return;

        int currentStock = accessory.getStock() != null ? accessory.getStock() : 0;
        int newStock = Math.max(currentStock - item.getQuantity(), 0);
        accessory.setStock(newStock);

        accessoryRepository.save(accessory);
    }

    private void validateUserProfile(User user) {
        boolean hasUsername = user.getUsername() != null && !user.getUsername().isBlank();
        boolean hasName = user.getFirstname() != null && !user.getFirstname().isBlank() && 
                         user.getLastname() != null && !user.getLastname().isBlank();
        boolean hasPhone = user.getPhone() != null && user.getPhone().matches("^[0-9]{10,11}$");
        boolean hasAddress = user.getAddress() != null && !user.getAddress().isBlank();
        boolean hasEmail = user.getEmail() != null && !user.getEmail().isBlank() && 
                          !user.getEmail().endsWith(PLACEHOLDER_EMAIL_DOMAIN);
        boolean hasCredentials = "LOCAL".equalsIgnoreCase(user.getAuthProvider()) || 
                                Boolean.TRUE.equals(user.getHasLocalCredentials());

        if (!hasUsername || !hasName || !hasPhone || !hasAddress || !hasEmail || !hasCredentials) {
            throw new BadRequestException("Please complete your profile (username, name, phone, address, email) and set a password before placing an order");
        }
    }

    private double calculateTierDiscount(MembershipTier tier, double amount) {
        switch (tier) {
            case SILVER:
                return amount * 0.02;
            case GOLD:
                return amount * 0.05;
            case PLATINUM:
                return amount * 0.10;
            default:
                return 0.0;
        }
    }
}
