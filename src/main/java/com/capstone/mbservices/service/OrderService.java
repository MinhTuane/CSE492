package com.capstone.mbservices.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class OrderService {
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final MotorcycleRepository motorcycleRepository;
    private final AccessoryRepository accessoryRepository;
    private final StoreRepository storeRepository;
    private final EmailService emailService;
    private final WebhookService webhookService;
    private final com.capstone.mbservices.service.ZaloPayService zaloPayService;
    private final NotificationService notificationService;
    private final DiscountCodeService discountCodeService;
    private final EInvoiceService eInvoiceService;
    private final WarrantyService warrantyService;
    private final RegistrationDetailsRepository registrationDetailsRepository;

    private static final String PLACEHOLDER_EMAIL_DOMAIN = "@mbservices.local";

    @Transactional
    public Order createOrder(OrderRequest request) {
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
        Motorcycle motorcycle = motorcycleRepository.findByIdForUpdate(itemReq.getItemId())
            .orElseThrow(() -> new ResourceNotFoundException("Motorcycle not found: " + itemReq.getItemId()));

        int availableStock = motorcycle.getStock() != null ? motorcycle.getStock() : 0;
        if (availableStock < itemReq.getQuantity()) {
            throw new BadRequestException("Insufficient stock for motorcycle: " + motorcycle.getModel() + 
                ". Available: " + availableStock + ", Requested: " + itemReq.getQuantity());
        }

        int newStock = availableStock - itemReq.getQuantity();
        motorcycle.setStock(newStock);
        if (newStock <= 0) {
            motorcycle.setStatus(MotorcycleStatus.OUT_OF_STOCK);
        }
        motorcycleRepository.save(motorcycle);

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
        Accessory accessory = accessoryRepository.findByIdForUpdate(itemReq.getItemId())
            .orElseThrow(() -> new ResourceNotFoundException("Accessory not found: " + itemReq.getItemId()));

        int availableStock = accessory.getStock() != null ? accessory.getStock() : 0;
        if (availableStock < itemReq.getQuantity()) {
            throw new BadRequestException("Insufficient stock for accessory: " + accessory.getName() + 
                ". Available: " + availableStock + ", Requested: " + itemReq.getQuantity());
        }

        accessory.setStock(availableStock - itemReq.getQuantity());
        accessoryRepository.save(accessory);

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

    private void validateUserProfile(User user) {
        boolean isSocial = "GOOGLE".equalsIgnoreCase(user.getAuthProvider()) || 
                           "FACEBOOK".equalsIgnoreCase(user.getAuthProvider());
        boolean hasUsername = isSocial || (user.getUsername() != null && !user.getUsername().isBlank());
        boolean hasName = user.getFirstname() != null && !user.getFirstname().isBlank() && 
                          user.getLastname() != null && !user.getLastname().isBlank();
        boolean hasPhone = user.getPhone() != null && user.getPhone().matches("^[0-9]{10,11}$");
        boolean hasAddress = user.getAddress() != null && !user.getAddress().isBlank();
        boolean hasEmail = user.getEmail() != null && !user.getEmail().isBlank() && 
                           !user.getEmail().endsWith(PLACEHOLDER_EMAIL_DOMAIN);
        boolean hasCredentials = isSocial || 
                                 "LOCAL".equalsIgnoreCase(user.getAuthProvider()) || 
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

    public Order getOrderById(String id) {
        return orderRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
    }

    public List<Order> getUserOrders(String userId) {
        return orderRepository.findByUserIdOrderByCreateAtDesc(userId);
    }

    @Transactional
    public Order updateOrderStatus(String id, OrderStatus status) {
        Order order = getOrderById(id);
        validateOrderStatusTransition(order.getStatus(), status);

        if (status == OrderStatus.PAID && order.getStatus() == OrderStatus.PENDING) {
            settlePaymentForOrder(order);
            order.setPaidAt(LocalDateTime.now());
        } else if (status == OrderStatus.SHIPPED) {
            order.setShippedAt(LocalDateTime.now());
        } else if (status == OrderStatus.DELIVERED) {
            order.setDeliveredAt(LocalDateTime.now());
            // Use new OrderItem-based logic if available, otherwise fallback to old logic
            if (order.getOrderItems() != null && !order.getOrderItems().isEmpty()) {
                applyDeliveredInventoryAndLoyaltyV2(order);
            } else {
                applyDeliveredInventoryAndLoyalty(order);
            }
        }

        order.setStatus(status);

        Order updatedOrder = orderRepository.save(order);
        webhookService.sendOrderUpdate(updatedOrder);

        notificationService.sendToUser(
            updatedOrder.getUser(),
            "Order Update",
            "Your order #" + updatedOrder.getOrderNumber() + " is now " + status,
            "ORDER",
            updatedOrder.getId()
        );

        return updatedOrder;
    }

    private void applyDeliveredInventoryAndLoyalty(Order order) {
        if (order.getMotorcycles() != null) {
            Map<String, Long> counts = order.getMotorcycles().stream()
                .collect(Collectors.groupingBy(Motorcycle::getId, Collectors.counting()));
            for (Map.Entry<String, Long> e : counts.entrySet()) {
                Motorcycle motorcycle = motorcycleRepository.findById(e.getKey())
                    .orElse(null);
                if (motorcycle == null) continue;
                int dec = e.getValue().intValue();
                int newStock = Math.max((motorcycle.getStock() != null ? motorcycle.getStock() : 0) - dec, 0);
                motorcycle.setStock(newStock);
                if (newStock <= 0) {
                    motorcycle.setStatus(MotorcycleStatus.OUT_OF_STOCK);
                } else if (motorcycle.getStatus() == MotorcycleStatus.OUT_OF_STOCK) {
                    motorcycle.setStatus(MotorcycleStatus.AVAILABLE);
                }
                motorcycleRepository.save(motorcycle);
            }
        }
        if (order.getAccessories() != null) {
            Map<String, Long> accCounts = order.getAccessories().stream()
                .collect(Collectors.groupingBy(Accessory::getId, Collectors.counting()));
            for (Map.Entry<String, Long> e : accCounts.entrySet()) {
                Accessory accessory = accessoryRepository.findById(e.getKey()).orElse(null);
                if (accessory == null) continue;
                int dec = e.getValue().intValue();
                int newStock = Math.max((accessory.getStock() != null ? accessory.getStock() : 0) - dec, 0);
                accessory.setStock(newStock);
                accessoryRepository.save(accessory);
            }
        }

        User user = order.getUser();
        if (user != null && order.getTotalAmount() != null) {
            long pointsToAdd = MoneyUtil.roundVnd(order.getTotalAmount()) / 100_000L;
            int newPoints = (user.getLoyaltyPoints() != null ? user.getLoyaltyPoints() : 0) + (int) pointsToAdd;
            user.setLoyaltyPoints(newPoints);

            upgradeMembershipTier(user, newPoints);

            userRepository.save(user);
        }
    }

    /**
     * Upgrade-only tier logic: never downgrades a user's tier.
     * Tier is based on cumulative achievement, not current balance,
     * so redeeming points should not cause downgrade.
     */
    private void upgradeMembershipTier(User user, int pointsAfterEarn) {
        MembershipTier current = user.getMembershipTier() != null ? user.getMembershipTier() : MembershipTier.BRONZE;
        MembershipTier earned;
        if (pointsAfterEarn >= 5000) earned = MembershipTier.PLATINUM;
        else if (pointsAfterEarn >= 2000) earned = MembershipTier.GOLD;
        else if (pointsAfterEarn >= 500) earned = MembershipTier.SILVER;
        else earned = MembershipTier.BRONZE;
        if (earned.ordinal() > current.ordinal()) {
            user.setMembershipTier(earned);
        }
    }

    /**
     * New version using OrderItem entities with proper quantity support
     */
    private void applyDeliveredInventoryAndLoyaltyV2(Order order) {
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

            upgradeMembershipTier(user, newPoints);

            userRepository.save(user);
        }
    }

    private void validateOrderStatusTransition(OrderStatus currentStatus, OrderStatus newStatus) {
        Map<OrderStatus, List<OrderStatus>> validTransitions = Map.of(
            OrderStatus.PENDING, Arrays.asList(OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.CANCELLED),
            OrderStatus.PAID, Arrays.asList(OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.CANCELLED),
            OrderStatus.PROCESSING, Arrays.asList(OrderStatus.SHIPPED, OrderStatus.CANCELLED),
            OrderStatus.SHIPPED, Arrays.asList(OrderStatus.DELIVERED, OrderStatus.CANCELLED),
            OrderStatus.DELIVERED, List.of(OrderStatus.REFUNDED),
            OrderStatus.CANCELLED, List.of(),
            OrderStatus.REFUNDED, List.of()
        );

        List<OrderStatus> allowed = validTransitions.get(currentStatus);
        if (allowed == null || !allowed.contains(newStatus)) {
            throw new BadRequestException("Invalid status transition from " + currentStatus + " to " + newStatus);
        }
    }

    /**
     * Records discount usage and loyalty deduction once, when payment is confirmed.
     */
    private void settlePaymentForOrder(Order order) {
        if (Boolean.TRUE.equals(order.getPaymentSettlementDone())) {
            return;
        }
        if (order.getDiscountCode() != null && !order.getDiscountCode().isBlank()) {
            discountCodeService.consumeDiscountCode(order.getDiscountCode());
        }
        if (Boolean.TRUE.equals(order.getUseLoyaltyPoints())
                && order.getLoyaltyPointsRedeemed() != null
                && order.getLoyaltyPointsRedeemed() > 0) {
            User user = userRepository.findById(order.getUser().getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            int cur = user.getLoyaltyPoints() != null ? user.getLoyaltyPoints() : 0;
            int redeem = order.getLoyaltyPointsRedeemed();
            if (cur < redeem) {
                throw new BadRequestException("Insufficient loyalty points to complete payment");
            }
            user.setLoyaltyPoints(cur - redeem);
            userRepository.save(user);
        }
        order.setPaymentSettlementDone(true);
    }

    /**
     * Manual payment override by SUPER_ADMIN. Logs audit trail and prefixes
     * transactionId with "MANUAL-" so it can be distinguished from real gateway txns.
     */
    @Transactional
    public Order processManualPayment(String id, String transactionId, String reason) {
        if (transactionId == null || transactionId.isBlank()) {
            throw new BadRequestException("Transaction ID is required");
        }
        if (reason == null || reason.isBlank()) {
            throw new BadRequestException("Reason is required for manual payment");
        }
        String taggedTxn = transactionId.startsWith("MANUAL-") ? transactionId : "MANUAL-" + transactionId;
        log.warn("[AUDIT] Manual payment override for order={} txn={} reason={}", id, taggedTxn, reason);
        return processPayment(id, taggedTxn);
    }

    @Transactional
    public Order processPayment(String id, String transactionId) {
        // Acquire pessimistic write lock to prevent concurrent gateway callbacks
        // (VNPay/Momo/ZaloPay can retry the same IPN) from double-processing.
        Order order = orderRepository.findByIdForUpdate(id)
            .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        // Prevent duplicate payment processing (idempotency)
        if (order.getStatus() == OrderStatus.PAID) {
            // Already paid, return existing order
            return order;
        }
        
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new BadRequestException("Only pending orders can be paid. Current status: " + order.getStatus());
        }
        
        // Check if transaction ID already exists to prevent replay attacks
        if (transactionId != null && !transactionId.isBlank()) {
            boolean txnExists = orderRepository.existsByTransactionId(transactionId);
            if (txnExists) {
                throw new BadRequestException("Transaction ID already used");
            }
        }
        
        settlePaymentForOrder(order);
        order.setTransactionId(transactionId);
        order.setStatus(OrderStatus.PAID);
        order.setPaidAt(LocalDateTime.now());
        order = orderRepository.save(order);
        
        // Step 1: Parse and store Dealer-Assisted Registration Details
        processRegistrationDetails(order);

        // Step 2: Generate VAT Electronic Invoice Mock Log
        eInvoiceService.generateInvoice(order);

        // Step 3: Activate E-Warranty Card for purchased motorcycles
        warrantyService.activateWarrantyForOrder(order);

        webhookService.sendOrderUpdate(order);
        return order;
    }

    private void processRegistrationDetails(Order order) {
        if (order == null || order.getNotes() == null) return;
        
        String notes = order.getNotes();
        if (notes.contains("[License Plate Service]")) {
            try {
                // Example notes text: "[License Plate Service] Citizen ID: 001202003456, Province: Hà Nội, District: Cầu Giấy"
                String idCard = extractValue(notes, "Citizen ID:");
                String province = extractValue(notes, "Province:");
                String district = extractValue(notes, "District:");

                var details = com.capstone.mbservices.entity.RegistrationDetails.builder()
                        .order(order)
                        .idCardNumber(idCard)
                        .province(province)
                        .district(district)
                        .dealerAssisted(true)
                        .status("PENDING")
                        .build();

                registrationDetailsRepository.save(details);
                log.info("📝 [REGISTRATION] Extracted and saved registration details for order: {}", order.getOrderNumber());
            } catch (Exception e) {
                log.error("Failed to parse registration details from notes", e);
            }
        }
    }

    private String extractValue(String text, String key) {
        int index = text.indexOf(key);
        if (index == -1) return "";
        int start = index + key.length();
        int end = text.indexOf(",", start);
        if (end == -1) {
            end = text.indexOf("\n", start);
        }
        if (end == -1) {
            end = text.length();
        }
        return text.substring(start, end).trim();
    }

    public Page<Order> getOrders(int page, int size, String status, String search) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createAt"));

        if (status != null && !status.isEmpty()) {
            OrderStatus orderStatus = OrderStatus.valueOf(status);
            return orderRepository.findByStatus(orderStatus, pageable);
        } else if (search != null && !search.isEmpty()) {
            return orderRepository.findByOrderNumberContainingIgnoreCase(search, pageable);
        }

        return orderRepository.findAll(pageable);
    }
}
