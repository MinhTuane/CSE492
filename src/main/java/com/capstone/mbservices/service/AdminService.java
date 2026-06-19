package com.capstone.mbservices.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.annotation.CacheEvict;
import com.capstone.mbservices.dto.response.DashboardResponse;
import com.capstone.mbservices.dto.request.MotorcycleRequest;
import com.capstone.mbservices.entity.*;
import com.capstone.mbservices.enums.*;
import com.capstone.mbservices.exception.ResourceNotFoundException;
import com.capstone.mbservices.exception.BadRequestException;
import com.capstone.mbservices.repository.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {
    private final UserRepository userRepository;
    private final MotorcycleRepository motorcycleRepository;
    private final OrderRepository orderRepository;
    private final MaintenanceServiceRepository maintenanceServiceRepository;
    private final TestRideRepository testRideRepository;
    private final ReviewRepository reviewRepository;
    private final StaffRepository staffRepository;
    private final ForumPostRepository forumPostRepository;
    private final ForumCommentRepository forumCommentRepository;
    private final StoreRepository storeRepository;
    private final ServiceOfferingRepository serviceOfferingRepository;
    private final CloudinaryService cloudinaryService;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final DiscountCodeRepository discountCodeRepository;
    private final AccessoryRepository accessoryRepository;
    private final BookingService bookingService;
    
    private static final Map<String, List<String>> LOCAL_IMAGE_MAP = new HashMap<>();
    static {
        LOCAL_IMAGE_MAP.put("YAMAHA|YZF-R3", List.of("/images/motorcycles/rbk-t1-yamaha-r3-black-blue-gold-render.webp"));
        LOCAL_IMAGE_MAP.put("YAMAHA|YZF-R1", List.of("/images/motorcycles/2025-Yamaha-YZF1000R1COMP-EU-Tech_Black-360-Degrees-001-03_Mobile.jpg"));
        LOCAL_IMAGE_MAP.put("YAMAHA|YZF-R1 WorldSBK", List.of("/images/motorcycles/Yamaha_Racing_WorldSBK_2025_YZF-R1_Jonathan_Rea_139.jpg"));
        
        LOCAL_IMAGE_MAP.put("HONDA|CBR650R", List.of("/images/motorcycles/honda-select-model-matte-gunpower-black-metallic-1644556118299.avif"));
        LOCAL_IMAGE_MAP.put("HONDA|CBR Sport Concept", List.of("/images/motorcycles/Honda-Light-Weight-Super-Sports-Concept-scaled.webp"));
        LOCAL_IMAGE_MAP.put("HONDA|CBR1000RR-R", List.of("/images/motorcycles/2026-cbr1000rr-pearl_white-1505x923.avif"));
        
        LOCAL_IMAGE_MAP.put("KAWASAKI|Ninja ZX-10RR", List.of("/images/motorcycles/2017-Kawasaki-Ninja-ZX-10RR-04-scaled.webp"));
        LOCAL_IMAGE_MAP.put("KAWASAKI|Ninja ZX-10R", List.of("/images/motorcycles/5-111.jpg"));
        LOCAL_IMAGE_MAP.put("KAWASAKI|Ninja ZX-10R ABS SE", List.of("/images/motorcycles/Kawasaki-Ninja-ZX-10R-ABS-01.jpg"));
        LOCAL_IMAGE_MAP.put("KAWASAKI|Ninja 650", List.of("/images/motorcycles/kawasaki-ninja-650-2021-1-0909.png"));
        LOCAL_IMAGE_MAP.put("KAWASAKI|Ninja H2R", List.of("/images/motorcycles/3dc4ccba-aefc-43e1-aa52-d361b442b781.png"));
        LOCAL_IMAGE_MAP.put("KAWASAKI|Ninja 400", List.of("/images/motorcycles/e946a82f-6e78-4531-82f2-72cb6699fc58.png"));
        LOCAL_IMAGE_MAP.put("KAWASAKI|Z650", List.of("/images/motorcycles/6c343928-3abf-4efb-b71e-656b184f05db.png"));
        LOCAL_IMAGE_MAP.put("KAWASAKI|Ninja 650 Sport", List.of("/images/motorcycles/b5da15c5-07b6-400e-b052-7f00eaeaa620.jpg"));
        
        LOCAL_IMAGE_MAP.put("DUCATI|Hypermotard 950", List.of("/images/motorcycles/a5464a70-17c3-4e09-8877-90fb55f6f38b.webp"));
        LOCAL_IMAGE_MAP.put("DUCATI|Streetfighter V4", List.of("/images/motorcycles/Streetfighter.png"));
        LOCAL_IMAGE_MAP.put("DUCATI|Diavel 1260", List.of("/images/motorcycles/The-Ducati-Diavel-1260-and-xDiavel-gear-patrol-jpg.webp"));
        LOCAL_IMAGE_MAP.put("DUCATI|Panigale V4 Bagnaia", List.of("/images/motorcycles/Panigale-V4-Bagnaia-World-Champion-Model-Preview-1200x800-1.png"));
        LOCAL_IMAGE_MAP.put("DUCATI|Supersport 950 S", List.of("/images/motorcycles/_3_______Supersport-950-S-MY21-Red-01-Model-Preview-1050x650.png"));
        LOCAL_IMAGE_MAP.put("DUCATI|Diavel V4", List.of("/images/motorcycles/Diavel_V4.png"));
        LOCAL_IMAGE_MAP.put("DUCATI|Streetfighter V2", List.of("/images/motorcycles/Model-Menu-MY22-HYM-SP-v06.png"));
        
        LOCAL_IMAGE_MAP.put("SUZUKI|GSX-8R", List.of("/images/motorcycles/suzuki_gsx8r_kiirolimitededition_sideon.png"));
        LOCAL_IMAGE_MAP.put("SUZUKI|GSX-S1000", List.of("/images/motorcycles/fdb74833-7846-466d-ae8f-695796e5cada.jpg"));
        LOCAL_IMAGE_MAP.put("SUZUKI|Hayabusa", List.of("/images/motorcycles/1107_02.jpg"));
        LOCAL_IMAGE_MAP.put("SUZUKI|Hayabusa Blue Storm", List.of("/images/motorcycles/eyJvdXRwdXRGb3JtYXQiOiJqcGciLCJidWNrZXQiOiJ6YWxhLXByb2R1Y3Rpb24iLCJrZXkiOiJhY2NvdW50LTEwMDBcLzE3NTgyMDc4MDE0NDBfMzE2NzU5MVwvSGF5YWJ1c2EuanBnIiwiZWRpdHMiOnsicm90YXRlIjpudWxsLCJyZXNpemUiOnsiaGVpZ2h0Ijo2NDAsIndpZHRoIj.jpg"));
        LOCAL_IMAGE_MAP.put("SUZUKI|GSX-R150", List.of("/images/motorcycles/GSX-R150_YSF_Right.webp"));
        
        LOCAL_IMAGE_MAP.put("BMW|R1300 GS", List.of("/images/motorcycles/6000000012.jpg"));
        LOCAL_IMAGE_MAP.put("BMW|R1250RS", List.of("/images/motorcycles/image28.jpg"));
        LOCAL_IMAGE_MAP.put("BMW|M1000R", List.of("/images/motorcycles/nsc-m1000r-P0N3S-modeloverview_600x360_jpg_asset_1664888615211.avif"));
        
        LOCAL_IMAGE_MAP.put("HARLEY-DAVIDSON|Iron 883", List.of("/images/motorcycles/harley-davidson-motorcycles.webp"));
        LOCAL_IMAGE_MAP.put("HARLEY-DAVIDSON|Street Bob 114", List.of("/images/motorcycles/Screenshot-1.webp"));
        LOCAL_IMAGE_MAP.put("HARLEY-DAVIDSON|Low Rider S", List.of("/images/motorcycles/images.jpg"));
    }
    
    private String getCurrentUserStoreId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        String email = auth.getName();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user != null && (user.getRole() == UserRole.STAFF_SERVICE || user.getRole() == UserRole.STAFF_CS)) {
            Staff staff = staffRepository.findByUserId(user.getId()).orElse(null);
            if (staff != null && staff.getStore() != null) {
                return staff.getStore().getId();
            }
        }
        return null;
    }
    
    // ==================== DASHBOARD ====================
    
    public DashboardResponse getDashboard(String storeIdOverride) {
        String storeId = (storeIdOverride != null && !storeIdOverride.isBlank() && !"all".equalsIgnoreCase(storeIdOverride))
            ? storeIdOverride 
            : getCurrentUserStoreId();
        
        Long totalUsers = userRepository.count();
        Long totalMotorcycles = storeId != null ? (long) storeRepository.findById(storeId).map(s -> storeRepository.findById(storeId).get().getId() != null ? motorcycleRepository.count() : 0).orElse(0L) : motorcycleRepository.count(); // Approximate
        Long totalOrders = storeId != null ? (long) orderRepository.findByStoreId(storeId).size() : orderRepository.count();
        
        List<Order> orders = storeId != null ? orderRepository.findByStoreId(storeId) : orderRepository.findAll();
        
        Double totalRevenue = orders.stream()
            .filter(order -> order.getStatus() == OrderStatus.DELIVERED)
            .mapToDouble(order -> order.getTotalAmount() != null ? order.getTotalAmount() : 0.0)
            .sum();
        
        Long pendingOrders = orders.stream().filter(o -> o.getStatus() == OrderStatus.PENDING).count();
        
        List<TestRide> testRides = storeId != null ? testRideRepository.findAll().stream().filter(t -> t.getStore() != null && t.getStore().getId().equals(storeId)).toList() : testRideRepository.findAll();
        Long activeTestRides = testRides.stream().filter(t -> t.getStatus() == TestRideStatus.CONFIRMED).count();
        Long pendingTestRides = testRides.stream().filter(t -> t.getStatus() == TestRideStatus.PENDING).count();
        
        List<MaintenanceService> services = storeId != null ? maintenanceServiceRepository.findAll().stream().filter(s -> s.getStore() != null && s.getStore().getId().equals(storeId)).toList() : maintenanceServiceRepository.findAll();
        Long scheduledServices = services.stream().filter(s -> s.getStatus() == ServiceStatus.SCHEDULED).count();
        
        Long lowStockCount = (long) motorcycleRepository.findByStockLessThan(5).size();
        Long pendingReviews = reviewRepository.countByIsApproved(false);

        // Calculate Revenue Data for the last 6 months
        List<Object> revenueData = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        for (int i = 5; i >= 0; i--) {
            LocalDateTime startOfMonth = now.minusMonths(i).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
            LocalDateTime endOfMonth = startOfMonth.plusMonths(1).minusSeconds(1);
            String monthName = startOfMonth.getMonth().name().substring(0, 3);
            
            Double monthRevenue = orders.stream()
                .filter(o -> o.getStatus() == OrderStatus.DELIVERED && 
                            o.getCreateAt().isAfter(startOfMonth) && 
                            o.getCreateAt().isBefore(endOfMonth))
                .mapToDouble(o -> o.getTotalAmount() != null ? o.getTotalAmount() : 0.0)
                .sum();
                
            Long monthOrders = orders.stream()
                .filter(o -> o.getCreateAt().isAfter(startOfMonth) && 
                            o.getCreateAt().isBefore(endOfMonth))
                .count();
                
            Map<String, Object> monthData = new HashMap<>();
            monthData.put("name", monthName);
            monthData.put("revenue", monthRevenue);
            monthData.put("orders", monthOrders);
            revenueData.add(monthData);
        }
        
        return DashboardResponse.builder()
            .totalUsers(totalUsers)
            .totalMotorcycles(totalMotorcycles)
            .totalOrders(totalOrders)
            .totalRevenue(Long.valueOf(totalRevenue.longValue()))
            .pendingOrders(pendingOrders)
            .activeTestRides(activeTestRides)
            .scheduledServices(scheduledServices)
            .lowStockCount(lowStockCount)
            .pendingReviews(pendingReviews)
            .pendingTestRides(pendingTestRides)
            .revenueData(revenueData)
            .build();
    }
    
    public List<Order> getRecentOrders(int limit) {
        Pageable pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "createAt"));
        return orderRepository.findAll(pageable).getContent();
    }
    
    public List<Motorcycle> getLowStockMotorcycles() {
        return motorcycleRepository.findByStockLessThan(5);
    }
    
    // ==================== MOTORCYCLE MANAGEMENT ====================
    
    public Page<Motorcycle> getAllMotorcycles(int page, int size, String brand, String status, String search) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createAt"));
        
        // Apply filters
        if (brand != null && !brand.isEmpty() && status != null && !status.isEmpty()) {
            MotorcycleStatus motorcycleStatus = MotorcycleStatus.valueOf(status);
            return motorcycleRepository.findByBrandAndStatus(brand, motorcycleStatus, pageable);
        } else if (brand != null && !brand.isEmpty()) {
            return motorcycleRepository.findByBrand(brand, pageable);
        } else if (status != null && !status.isEmpty()) {
            MotorcycleStatus motorcycleStatus = MotorcycleStatus.valueOf(status);
            return motorcycleRepository.findByStatus(motorcycleStatus, pageable);
        } else if (search != null && !search.isEmpty()) {
            return motorcycleRepository.findByModelContainingIgnoreCaseOrBrandContainingIgnoreCase(
                search, search, pageable);
        }
        
        return motorcycleRepository.findAll(pageable);
    }
    
    @Transactional
    @CacheEvict(value = {"brands", "categories"}, allEntries = true)
    public Motorcycle addMotorcycle(MotorcycleRequest request) {
        Motorcycle motorcycle = Motorcycle.builder()
            .brand(request.getBrand())
            .model(request.getModel())
            .year(request.getYear())
            .category(request.getCategory())
            .price(request.getPrice())
            .discountPercentage(request.getDiscountPercentage() != null ? request.getDiscountPercentage() : 0.0)
            .status(MotorcycleStatus.AVAILABLE)
            .description(request.getDescription())
            .engineType(request.getEngineType())
            .displacement(request.getDisplacement())
            .power(request.getPower())
            .torque(request.getTorque())
            .weight(request.getWeight())
            .topSpeed(request.getTopSpeed())
            .fuelCapacity(request.getFuelCapacity())
            .stock(request.getStock() != null ? request.getStock() : 0)
            .images(request.getImages())
            .features(request.getFeatures())
            .color(request.getColor())
            .build();
        
        return motorcycleRepository.save(motorcycle);
    }
    
    @Transactional
    @CacheEvict(value = {"brands", "categories"}, allEntries = true)
    public Motorcycle updateMotorcycle(String id, MotorcycleRequest request) {
        Motorcycle motorcycle = motorcycleRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Motorcycle not found with id: " + id));
        
        motorcycle.setBrand(request.getBrand());
        motorcycle.setModel(request.getModel());
        motorcycle.setYear(request.getYear());
        motorcycle.setCategory(request.getCategory());
        motorcycle.setPrice(request.getPrice());
        motorcycle.setDiscountPercentage(request.getDiscountPercentage() != null ? request.getDiscountPercentage() : 0.0);
        motorcycle.setDescription(request.getDescription());
        motorcycle.setEngineType(request.getEngineType());
        motorcycle.setDisplacement(request.getDisplacement());
        motorcycle.setPower(request.getPower());
        motorcycle.setTorque(request.getTorque());
        motorcycle.setWeight(request.getWeight());
        motorcycle.setTopSpeed(request.getTopSpeed());
        motorcycle.setFuelCapacity(request.getFuelCapacity());
        motorcycle.setStock(request.getStock());
        motorcycle.setImages(request.getImages());
        motorcycle.setFeatures(request.getFeatures());
        motorcycle.setColor(request.getColor());
        
        return motorcycleRepository.save(motorcycle);
    }
    
    @Transactional
    @CacheEvict(value = {"brands", "categories"}, allEntries = true)
    public void deleteMotorcycle(String id) {
        Motorcycle motorcycle = motorcycleRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Motorcycle not found with id: " + id));
        
        // Check if motorcycle is in any pending orders
        List<Order> pendingOrders = orderRepository.findByStatus(OrderStatus.PENDING);
        boolean isInPendingOrder = pendingOrders.stream()
            .anyMatch(order -> order.getOrderItems() != null && order.getOrderItems().stream()
                .anyMatch(item -> item.getItemType() == ItemType.MOTORCYCLE && item.getItemId().equals(id)));
        
        if (isInPendingOrder) {
            throw new BadRequestException("Cannot delete motorcycle that is in pending orders");
        }
        
        motorcycleRepository.delete(motorcycle);
    }
    
    @Transactional
    @CacheEvict(value = {"brands", "categories"}, allEntries = true)
    public Motorcycle updateMotorcycleStock(String id, Integer stock) {
        Motorcycle motorcycle = motorcycleRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Motorcycle not found with id: " + id));
        
        motorcycle.setStock(stock);
        
        // Auto-update status based on stock
        if (stock <= 0) {
            motorcycle.setStatus(MotorcycleStatus.OUT_OF_STOCK);
        } else if (motorcycle.getStatus() == MotorcycleStatus.OUT_OF_STOCK) {
            motorcycle.setStatus(MotorcycleStatus.AVAILABLE);
        }
        
        return motorcycleRepository.save(motorcycle);
    }
    
    @Transactional
    @CacheEvict(value = {"brands", "categories"}, allEntries = true)
    public Motorcycle updateMotorcycleStatus(String id, MotorcycleStatus status) {
        Motorcycle motorcycle = motorcycleRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Motorcycle not found with id: " + id));
        
        motorcycle.setStatus(status);
        return motorcycleRepository.save(motorcycle);
    }
    
    @Transactional
    public Map<String, Object> migrateMotorcycleImages() {
        List<Motorcycle> all = motorcycleRepository.findAll();
        int migratedImages = 0;
        int processedMotorcycles = 0;
        List<String> errors = new ArrayList<>();
        
        for (Motorcycle m : all) {
            processedMotorcycles++;
            List<String> imgs = m.getImages();
            if (imgs == null || imgs.isEmpty()) continue;
            
            List<String> newUrls = new ArrayList<>();
            for (String url : imgs) {
                try {
                    String lower = url != null ? url.toLowerCase() : "";
                    boolean isRemote = lower.startsWith("http://") || lower.startsWith("https://");
                    if (isRemote) {
                        boolean isCloudinary = lower.contains("cloudinary.com") || lower.contains("res.cloudinary.com");
                        if (isCloudinary) {
                            newUrls.add(url);
                        } else {
                            String uploaded = cloudinaryService.uploadUrl(url, "motorcycles");
                            newUrls.add(uploaded);
                            migratedImages++;
                        }
                        continue;
                    }
                    String rel = url.startsWith("/") ? url.substring(1) : url;
                    String cp = "static/" + rel;
                    org.springframework.core.io.ClassPathResource res = new org.springframework.core.io.ClassPathResource(cp);
                    if (!res.exists()) {
                        String nameOnly = rel.contains("/") ? rel.substring(rel.lastIndexOf('/') + 1) : rel;
                        res = new org.springframework.core.io.ClassPathResource("static/images/motorcycles/" + nameOnly);
                    }
                    if (!res.exists()) {
                        String label = (((m.getBrand() != null ? m.getBrand() : "")) + " " + ((m.getModel() != null ? m.getModel() : ""))).trim();
                        String text = label.isBlank() ? "Motorcycle" : label;
                        String uploaded = cloudinaryService.uploadPlaceholder(text, "motorcycles");
                        newUrls.add(uploaded);
                        migratedImages++;
                        continue;
                    }
                    try (java.io.InputStream is = res.getInputStream()) {
                        byte[] bytes = is.readAllBytes();
                        String uploaded = cloudinaryService.uploadBytes(bytes, "motorcycles");
                        newUrls.add(uploaded);
                        migratedImages++;
                    }
                } catch (Exception e) {
                    try {
                        String label = (((m.getBrand() != null ? m.getBrand() : "")) + " " + ((m.getModel() != null ? m.getModel() : ""))).trim();
                        String text = label.isBlank() ? "Motorcycle" : label;
                        String uploaded = cloudinaryService.uploadPlaceholder(text, "motorcycles");
                        newUrls.add(uploaded);
                        migratedImages++;
                    } catch (Exception ex) {
                        errors.add("Upload error: " + e.getMessage() + " for motorcycle " + m.getId());
                        newUrls.add(url);
                    }
                }
            }
            m.setImages(newUrls);
            motorcycleRepository.save(m);
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("processedMotorcycles", processedMotorcycles);
        result.put("migratedImages", migratedImages);
        result.put("errors", errors);
        return result;
    }
    
    @Transactional
    public Map<String, Object> restoreLocalMotorcycleImages() {
        List<Motorcycle> all = motorcycleRepository.findAll();
        int updated = 0;
        List<String> notMapped = new ArrayList<>();
        
        for (Motorcycle m : all) {
            String key = (m.getBrand() + "|" + m.getModel()).trim();
            List<String> local = LOCAL_IMAGE_MAP.get(key);
            if (local != null && !local.isEmpty()) {
                m.setImages(new ArrayList<>(local));
                motorcycleRepository.save(m);
                updated++;
            } else {
                notMapped.add(key);
            }
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("processedMotorcycles", all.size());
        result.put("updatedToLocal", updated);
        result.put("notMapped", notMapped);
        return result;
    }
    
    @Transactional
    public Map<String, Object> migrateReviewImages() {
        List<Review> all = reviewRepository.findAll();
        int migratedImages = 0;
        int processedReviews = 0;
        List<String> errors = new ArrayList<>();
        
        for (Review r : all) {
            processedReviews++;
            List<String> imgs = r.getImages();
            if (imgs == null || imgs.isEmpty()) continue;
            
            List<String> newUrls = new ArrayList<>();
            for (String url : imgs) {
                try {
                    String lower = url != null ? url.toLowerCase() : "";
                    boolean isRemote = lower.startsWith("http://") || lower.startsWith("https://");
                    if (isRemote) {
                        String uploaded = cloudinaryService.uploadUrl(url, "reviews");
                        newUrls.add(uploaded);
                        migratedImages++;
                        continue;
                    }
                    String rel = url.startsWith("/") ? url.substring(1) : url;
                    String cp = "static/" + rel;
                    org.springframework.core.io.ClassPathResource res = new org.springframework.core.io.ClassPathResource(cp);
                    if (!res.exists()) {
                        // try fallback: static/images/<filename>
                        String nameOnly = rel.contains("/") ? rel.substring(rel.lastIndexOf('/') + 1) : rel;
                        res = new org.springframework.core.io.ClassPathResource("static/images/" + nameOnly);
                    }
                    if (!res.exists()) {
                        String text = "Review";
                        if (r.getMotorcycle() != null) {
                            String b = r.getMotorcycle().getBrand();
                            String m = r.getMotorcycle().getModel();
                            String t = ((b != null ? b : "") + " " + (m != null ? m : "")).trim();
                            if (!t.isBlank()) text = t;
                        }
                        String uploaded = cloudinaryService.uploadPlaceholder(text, "reviews");
                        newUrls.add(uploaded);
                        migratedImages++;
                        continue;
                    }
                    try (java.io.InputStream is = res.getInputStream()) {
                        byte[] bytes = is.readAllBytes();
                        String uploaded = cloudinaryService.uploadBytes(bytes, "reviews");
                        newUrls.add(uploaded);
                        migratedImages++;
                    }
                } catch (Exception e) {
                    try {
                        String text = "Review";
                        if (r.getMotorcycle() != null) {
                            String b = r.getMotorcycle().getBrand();
                            String m = r.getMotorcycle().getModel();
                            String t = ((b != null ? b : "") + " " + (m != null ? m : "")).trim();
                            if (!t.isBlank()) text = t;
                        }
                        String uploaded = cloudinaryService.uploadPlaceholder(text, "reviews");
                        newUrls.add(uploaded);
                        migratedImages++;
                    } catch (Exception ex) {
                        errors.add("Upload error: " + e.getMessage() + " for review " + r.getId());
                        newUrls.add(url);
                    }
                }
            }
            r.setImages(newUrls);
            reviewRepository.save(r);
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("processedReviews", processedReviews);
        result.put("migratedImages", migratedImages);
        result.put("errors", errors);
        return result;
    }
    
    // ==================== ORDER MANAGEMENT ====================
    
    public Page<Order> getAllOrders(int page, int size, String status, String search) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createAt"));
        String storeId = getCurrentUserStoreId();
        
        if (storeId != null) {
            if (status != null && !status.isEmpty()) {
                OrderStatus orderStatus = OrderStatus.valueOf(status);
                return orderRepository.findByStoreIdAndStatus(storeId, orderStatus, pageable);
            } else if (search != null && !search.isEmpty()) {
                return orderRepository.findByStoreIdAndOrderNumberContainingIgnoreCase(storeId, search, pageable);
            }
            return orderRepository.findByStoreId(storeId, pageable);
        } else {
            if (status != null && !status.isEmpty()) {
                OrderStatus orderStatus = OrderStatus.valueOf(status);
                return orderRepository.findByStatus(orderStatus, pageable);
            } else if (search != null && !search.isEmpty()) {
                return orderRepository.findByOrderNumberContainingIgnoreCase(search, pageable);
            }
            return orderRepository.findAll(pageable);
        }
    }
    
    public Order getOrderById(String orderId) {
        return orderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
    }
    
    @Transactional
    public Order updateOrderStatus(String orderId, OrderStatus status) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
        
        // Validate status transition
        validateOrderStatusTransition(order.getStatus(), status);
        
        order.setStatus(status);
        
        // Set timestamps based on status
        if (status == OrderStatus.PAID) {
            order.setPaidAt(LocalDateTime.now());
        } else if (status == OrderStatus.SHIPPED) {
            order.setShippedAt(LocalDateTime.now());
        } else if (status == OrderStatus.DELIVERED) {
            order.setDeliveredAt(LocalDateTime.now());
            // For V2 orders (OrderItem-based): stock was already reserved at creation. Do NOT deduct again.
            // For V1 legacy orders: fallback to motorcycles list stock deduction.
            if (order.getOrderItems() == null || order.getOrderItems().isEmpty()) {
                if (order.getMotorcycles() != null) {
                    for (Motorcycle motorcycle : order.getMotorcycles()) {
                        int current = motorcycle.getStock() != null ? motorcycle.getStock() : 0;
                        int newStock = Math.max(current - 1, 0);
                        motorcycle.setStock(newStock);
                        if (newStock <= 0) {
                            motorcycle.setStatus(MotorcycleStatus.OUT_OF_STOCK);
                        } else if (motorcycle.getStatus() == MotorcycleStatus.OUT_OF_STOCK) {
                            motorcycle.setStatus(MotorcycleStatus.AVAILABLE);
                        }
                        motorcycleRepository.save(motorcycle);
                    }
                }
            }
        }
        
        Order savedOrder = orderRepository.save(order);
        
        // Notify user
        notificationService.sendToUser(
            savedOrder.getUser(),
            "Order Status Updated",
            "Your order #" + savedOrder.getOrderNumber() + " is now " + status,
            "ORDER",
            savedOrder.getId()
        );
        
        return savedOrder;
    }
    
    @Transactional
    public Order cancelOrder(String orderId, String reason) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
        
        if (order.getStatus() == OrderStatus.DELIVERED || order.getStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("Cannot cancel order with status: " + order.getStatus());
        }
        
        order.setStatus(OrderStatus.CANCELLED);
        order.setNotes(order.getNotes() != null ? 
            order.getNotes() + "\nCancellation reason: " + reason : 
            "Cancellation reason: " + reason);
        
        // Restore points if user used loyalty points
        User user = order.getUser();
        if (user != null && Boolean.TRUE.equals(order.getUseLoyaltyPoints())) {
            double pointsDiscount = order.getDiscountAmount() != null ? order.getDiscountAmount() : 0.0;
            // Simplified logic to refund standard points: 100000 VND = 1000 points
            int refundedPoints = (int) ((pointsDiscount / 100000.0) * 1000);
            user.setLoyaltyPoints((user.getLoyaltyPoints() != null ? user.getLoyaltyPoints() : 0) + refundedPoints);
            userRepository.save(user);
        }
        
        // Restore discount code usage
        if (order.getDiscountCode() != null && !order.getDiscountCode().isEmpty()) {
            try {
                com.capstone.mbservices.entity.DiscountCode code = discountCodeRepository.findByCode(order.getDiscountCode()).orElse(null);
                if (code != null) {
                    code.setCurrentUsages(Math.max(0, code.getCurrentUsages() - 1));
                    discountCodeRepository.save(code);
                }
            } catch(Exception e) {
                // Ignore if discount code not found
            }
        }
        
        // For V2 orders (OrderItem-based): stock was reserved at creation, so restore it on cancel.
        // For V1 legacy orders: stock was only deducted at DELIVERED, so nothing to restore unless already DELIVERED.
        if (order.getOrderItems() != null && !order.getOrderItems().isEmpty()) {
            for (com.capstone.mbservices.entity.OrderItem item : order.getOrderItems()) {
                if (item.getItemType() == com.capstone.mbservices.enums.ItemType.MOTORCYCLE) {
                    com.capstone.mbservices.entity.Motorcycle moto = motorcycleRepository.findById(item.getItemId()).orElse(null);
                    if (moto != null) {
                        int restored = (moto.getStock() != null ? moto.getStock() : 0) + item.getQuantity();
                        moto.setStock(restored);
                        if (moto.getStatus() == com.capstone.mbservices.enums.MotorcycleStatus.OUT_OF_STOCK && restored > 0) {
                            moto.setStatus(com.capstone.mbservices.enums.MotorcycleStatus.AVAILABLE);
                        }
                        motorcycleRepository.save(moto);
                    }
                } else if (item.getItemType() == com.capstone.mbservices.enums.ItemType.ACCESSORY) {
                    com.capstone.mbservices.entity.Accessory acc = accessoryRepository.findById(item.getItemId()).orElse(null);
                    if (acc != null) {
                        acc.setStock((acc.getStock() != null ? acc.getStock() : 0) + item.getQuantity());
                        accessoryRepository.save(acc);
                    }
                }
            }
        }

        Order savedOrder = orderRepository.save(order);
        
        notificationService.sendToUser(
            savedOrder.getUser(),
            "Order Cancelled",
            "Your order #" + savedOrder.getOrderNumber() + " has been cancelled.",
            "ORDER",
            savedOrder.getId()
        );
        
        return savedOrder;
    }
    
    private void validateOrderStatusTransition(OrderStatus currentStatus, OrderStatus newStatus) {
        Map<OrderStatus, List<OrderStatus>> validTransitions = Map.of(
            OrderStatus.PENDING, List.of(OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.CANCELLED),
            OrderStatus.PAID, List.of(OrderStatus.PENDING, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.CANCELLED),
            OrderStatus.PROCESSING, List.of(OrderStatus.PENDING, OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.CANCELLED),
            OrderStatus.SHIPPED, List.of(OrderStatus.PENDING, OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.DELIVERED, OrderStatus.CANCELLED),
            OrderStatus.DELIVERED, List.of(),
            OrderStatus.CANCELLED, List.of(),
            OrderStatus.REFUNDED, List.of()
        );
        
        List<OrderStatus> allowed = validTransitions.get(currentStatus);
        if (allowed == null || !allowed.contains(newStatus)) {
            throw new BadRequestException("Invalid status transition from " + currentStatus + " to " + newStatus);
        }
    }
    
    // ==================== USER MANAGEMENT ====================
    
    public Page<User> getAllUsers(int page, int size, String role, String search) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createAt"));
        
        if (role != null && !role.isEmpty()) {
            UserRole userRole = UserRole.valueOf(role);
            return userRepository.findByRole(userRole, pageable);
        } else if (search != null && !search.isEmpty()) {
            return userRepository.findByEmailContainingIgnoreCaseOrFirstnameContainingIgnoreCaseOrLastnameContainingIgnoreCase(
                search, search, search, pageable);
        }
        
        return userRepository.findAll(pageable);
    }
    
    public User getUserDetails(String userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }
    
    @Transactional
    public User updateUserRole(String userId, UserRole role) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        
        user.setRole(role);
        return userRepository.save(user);
    }
    
    @Transactional
    public User toggleUserStatus(String userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        
        user.setIsActive(!user.getIsActive());
        return userRepository.save(user);
    }
    
    @Transactional
    public void deleteUser(String userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        
        // Check if user has pending orders
        List<Order> pendingOrders = orderRepository.findByUser(user).stream()
            .filter(order -> order.getStatus() == OrderStatus.PENDING || 
                           order.getStatus() == OrderStatus.PAID)
            .collect(Collectors.toList());
        
        if (!pendingOrders.isEmpty()) {
            throw new BadRequestException("Cannot delete user with pending orders");
        }
        
        userRepository.delete(user);
    }
    
    // ==================== STORE / FRANCHISE ====================
    @Transactional
    public Store approveStore(String storeId, String brand) {
        Store store = storeRepository.findById(storeId)
            .orElseThrow(() -> new ResourceNotFoundException("Store not found"));
        store.setBrand(brand);
        store.setLicensed(true);
        store.setContractStart(java.time.LocalDate.now());
        store.setContractEnd(java.time.LocalDate.now().plusYears(3));
        return storeRepository.save(store);
    }
    
    public Staff assignStaffToStore(String userId, String storeId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getRole() == UserRole.CUSTOMER) {
            throw new RuntimeException("Customers cannot be assigned to a store");
        }
        
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new RuntimeException("Store not found"));
                
        Staff staff = staffRepository.findByUserId(userId).orElse(new Staff());
        if (staff.getId() == null) {
            staff.setUser(user);
        }
        staff.setStore(store);
        
        return staffRepository.save(staff);
    }
    
    @Transactional
    public Store setStoreContract(String storeId, int years) {
        Store store = storeRepository.findById(storeId)
            .orElseThrow(() -> new ResourceNotFoundException("Store not found"));
        store.setContractStart(java.time.LocalDate.now());
        store.setContractEnd(java.time.LocalDate.now().plusYears(years));
        return storeRepository.save(store);
    }

    @Transactional
    public Store updateStore(String storeId, Map<String, Object> body) {
        Store store = storeRepository.findById(storeId)
            .orElseThrow(() -> new ResourceNotFoundException("Store not found with id: " + storeId));
        if (body.containsKey("name") && body.get("name") != null)
            store.setName(body.get("name").toString());
        if (body.containsKey("address") && body.get("address") != null)
            store.setAddress(body.get("address").toString());
        if (body.containsKey("phone") && body.get("phone") != null)
            store.setPhone(body.get("phone").toString());
        if (body.containsKey("brand") && body.get("brand") != null)
            store.setBrand(body.get("brand").toString());
        if (body.containsKey("latitude") && body.get("latitude") != null)
            store.setLatitude(Double.parseDouble(body.get("latitude").toString()));
        if (body.containsKey("longitude") && body.get("longitude") != null)
            store.setLongitude(Double.parseDouble(body.get("longitude").toString()));
        return storeRepository.save(store);
    }

    // ==================== BOOKING MANAGEMENT ====================
    
    public Page<TestRide> getAllTestRides(int page, int size, String status) {
        bookingService.expireTestRides(LocalDateTime.now());
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createAt"));
        
        if (status != null && !status.isEmpty()) {
            TestRideStatus testRideStatus = TestRideStatus.valueOf(status);
            return testRideRepository.findByStatus(testRideStatus, pageable);
        }
        
        return testRideRepository.findAll(pageable);
    }
    
    @Transactional
    public TestRide approveTestRide(String testRideId) {
        TestRide testRide = testRideRepository.findById(testRideId)
            .orElseThrow(() -> new ResourceNotFoundException("Test ride not found"));
        
        if (testRide.getStatus() != TestRideStatus.PENDING) {
            throw new BadRequestException("Can only approve pending test rides");
        }
        
        testRide.setStatus(TestRideStatus.CONFIRMED);
        testRide.setConfirmedAt(LocalDateTime.now());
        return testRideRepository.save(testRide);
    }
    
    @Transactional
    public TestRide rejectTestRide(String testRideId, String reason) {
        TestRide testRide = testRideRepository.findById(testRideId)
            .orElseThrow(() -> new ResourceNotFoundException("Test ride not found"));
        
        testRide.setStatus(TestRideStatus.CANCELLED);
        testRide.setNotes(testRide.getNotes() != null ? 
            testRide.getNotes() + "\nRejection reason: " + reason : 
            "Rejection reason: " + reason);
        
        return testRideRepository.save(testRide);
    }
    
    @Transactional
    public TestRide completeTestRide(String testRideId) {
        TestRide testRide = testRideRepository.findById(testRideId)
            .orElseThrow(() -> new ResourceNotFoundException("Test ride not found"));
        
        testRide.setStatus(TestRideStatus.COMPLETED);
        testRide.setCompletedAt(LocalDateTime.now());
        return testRideRepository.save(testRide);
    }
    
    public Page<MaintenanceService> getAllServices(int page, int size, String status) {
        bookingService.expireMaintenanceServices(LocalDateTime.now());
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createAt"));
        
        if (status != null && !status.isEmpty()) {
            ServiceStatus serviceStatus = ServiceStatus.valueOf(status);
            return maintenanceServiceRepository.findByStatus(serviceStatus, pageable);
        }
        
        return maintenanceServiceRepository.findAll(pageable);
    }

    
    @Transactional
    public MaintenanceService createService(com.capstone.mbservices.dto.request.ServiceScheduleRequest request) {
        User user = userRepository.findById(request.getUserId())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Motorcycle motorcycle = motorcycleRepository.findById(request.getMotorcycleId())
            .orElseThrow(() -> new ResourceNotFoundException("Motorcycle not found"));
        
        Double cost = null;
        String type = request.getServiceType();
        if (type != null) {
            switch (type) {
                case "Basic Oil Change":
                    cost = 150_000.0;
                    break;
                case "General Inspection":
                    cost = 300_000.0;
                    break;
                case "Brake Pad Replacement":
                    cost = 450_000.0;
                    break;
                case "Premium Care & Wash":
                    cost = 1_500_000.0;
                    break;
                case "Tire Replacement":
                    cost = 250_000.0;
                    break;
                default:
                    cost = 300_000.0;
            }
        }
        
        MaintenanceService service = MaintenanceService.builder()
            .user(user)
            .motorcycle(motorcycle)
            .serviceType(request.getServiceType())
            .description(request.getDescription())
            .scheduleDate(request.getScheduleDate())
            .notes(request.getNotes())
            .status(ServiceStatus.SCHEDULED)
            .cost(cost)
            .build();
        return maintenanceServiceRepository.save(service);
    }
    
    @Transactional
    public MaintenanceService updateServiceStatus(String serviceId, ServiceStatus status) {
        MaintenanceService service = maintenanceServiceRepository.findById(serviceId)
            .orElseThrow(() -> new ResourceNotFoundException("Service not found"));
        
        service.setStatus(status);
        
        if (status == ServiceStatus.COMPLETED) {
            service.setCompletedAt(LocalDateTime.now());
        }
        
        return maintenanceServiceRepository.save(service);
    }
    
    @Transactional
    public MaintenanceService updateService(String serviceId, com.capstone.mbservices.dto.request.ServiceUpdateRequest request) {
        MaintenanceService service = maintenanceServiceRepository.findById(serviceId)
            .orElseThrow(() -> new ResourceNotFoundException("Service not found"));
        
        if (request.getUserId() != null && !request.getUserId().isEmpty()) {
            User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            service.setUser(user);
        }
        if (request.getMotorcycleId() != null && !request.getMotorcycleId().isEmpty()) {
            Motorcycle motorcycle = motorcycleRepository.findById(request.getMotorcycleId())
                .orElseThrow(() -> new ResourceNotFoundException("Motorcycle not found"));
            service.setMotorcycle(motorcycle);
        }
        if (request.getServiceType() != null && !request.getServiceType().isEmpty()) {
            service.setServiceType(request.getServiceType());
        }
        if (request.getScheduleDate() != null) {
            service.setScheduleDate(request.getScheduleDate());
        }
        if (request.getDescription() != null) {
            service.setDescription(request.getDescription());
        }
        if (request.getNotes() != null) {
            service.setNotes(request.getNotes());
        }
        if (request.getTechnicianId() != null && !request.getTechnicianId().isEmpty()) {
            Staff staff = staffRepository.findById(request.getTechnicianId())
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found"));
            service.setTechnician(staff);
        }
        if (request.getCost() != null) {
            service.setCost(request.getCost());
        }
        if (request.getStatus() != null && !request.getStatus().isEmpty()) {
            ServiceStatus status = ServiceStatus.valueOf(request.getStatus());
            service.setStatus(status);
            if (status == ServiceStatus.COMPLETED) {
                service.setCompletedAt(LocalDateTime.now());
            }
        }
        
        return maintenanceServiceRepository.save(service);
    }
    
    @Transactional
    public void deleteService(String id) {
        MaintenanceService service = maintenanceServiceRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Service not found"));
        maintenanceServiceRepository.delete(service);
    }

    // ==================== SERVICE CATALOG ====================
    public Page<ServiceOffering> getAllServiceOfferings(int page, int size, String search, String storeId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createAt"));
        if (storeId != null && !storeId.isBlank()) {
            return serviceOfferingRepository.findByStoreId(storeId, pageable);
        }
        if (search != null && !search.isEmpty()) {
            return serviceOfferingRepository.findByNameContainingIgnoreCase(search, pageable);
        }
        return serviceOfferingRepository.findAll(pageable);
    }
    
    @Transactional
    public ServiceOffering createServiceOffering(com.capstone.mbservices.dto.request.ServiceOfferingRequest request) {
        Store store = null;
        if (request.getStoreId() != null && !request.getStoreId().isBlank()) {
            store = storeRepository.findById(request.getStoreId())
                .orElseThrow(() -> new ResourceNotFoundException("Store not found"));
        }
        ServiceOffering offering = ServiceOffering.builder()
            .name(request.getName())
            .subtitle(request.getSubtitle())
            .description(request.getDescription())
            .price(request.getPrice())
            .features(request.getFeatures())
            .active(request.getActive() != null ? request.getActive() : true)
            .store(store)
            .build();
        return serviceOfferingRepository.save(offering);
    }
    
    @Transactional
    public ServiceOffering updateServiceOffering(String id, com.capstone.mbservices.dto.request.ServiceOfferingRequest request) {
        ServiceOffering offering = serviceOfferingRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Service offering not found"));
        offering.setName(request.getName());
        offering.setSubtitle(request.getSubtitle());
        offering.setDescription(request.getDescription());
        offering.setPrice(request.getPrice());
        offering.setFeatures(request.getFeatures());
        if (request.getActive() != null) {
            offering.setActive(request.getActive());
        }
        if (request.getStoreId() != null && !request.getStoreId().isBlank()) {
            Store store = storeRepository.findById(request.getStoreId())
                .orElseThrow(() -> new ResourceNotFoundException("Store not found"));
            offering.setStore(store);
        }
        return serviceOfferingRepository.save(offering);
    }
    
    @Transactional
    public void deleteServiceOffering(String id) {
        ServiceOffering offering = serviceOfferingRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Service offering not found"));
        serviceOfferingRepository.delete(offering);
    }
    
    @Transactional
    public ServiceOffering setServiceOfferingActive(String id, boolean active) {
        ServiceOffering offering = serviceOfferingRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Service offering not found"));
        offering.setActive(active);
        return serviceOfferingRepository.save(offering);
    }
    
    @Transactional
    public MaintenanceService assignStaffToService(String serviceId, String staffId) {
        MaintenanceService service = maintenanceServiceRepository.findById(serviceId)
            .orElseThrow(() -> new ResourceNotFoundException("Service not found"));
        
        Staff staff = staffRepository.findById(staffId)
            .orElseThrow(() -> new ResourceNotFoundException("Staff not found"));
        
        if (staff.getUser() == null || staff.getUser().getRole() != UserRole.STAFF_SERVICE) {
            throw new BadRequestException("Only staff members with STAFF_SERVICE role can be assigned to repair services");
        }
        
        service.setTechnician(staff);
        MaintenanceService saved = maintenanceServiceRepository.save(service);
        notificationService.sendToUser(
            staff.getUser(),
            "New Service Assignment",
            "You have been assigned to a maintenance booking.",
            "SERVICE",
            saved.getId()
        );
        notificationService.sendToUser(
            saved.getUser(),
            "Service Assigned",
            "Your service booking has been assigned to a staff member.",
            "SERVICE",
            saved.getId()
        );
        emailService.sendStaffAssignedServiceEmail(saved, staff);
        return saved;
    }

    public List<Store> getAllStores() {
        return storeRepository.findAll();
    }

    public List<Staff> getAvailableStaff(String storeId, LocalDateTime start, int durationMinutes) {
        return getAvailableStaff(storeId, start, durationMinutes, null);
    }

    public List<Staff> getAvailableStaff(String storeId, LocalDateTime start, int durationMinutes, String roleFilter) {
        Store store = storeRepository.findById(storeId)
            .orElseThrow(() -> new ResourceNotFoundException("Store not found"));
        if (start == null) {
            throw new BadRequestException("Schedule time is required");
        }
        LocalDateTime end = start.plusMinutes(durationMinutes);
        List<Staff> staffInStore = new ArrayList<>();
        staffInStore.addAll(staffRepository.findByStoreId(store.getId()));
        staffInStore.addAll(staffRepository.findByStoreIsNull());
        Map<String, Staff> unique = new LinkedHashMap<>();
        for (Staff s : staffInStore) {
            if (s != null && s.getId() != null) {
                unique.putIfAbsent(s.getId(), s);
            }
        }
        return unique.values().stream()
            .filter(s -> s.getUser() != null && (roleFilter == null || roleFilter.isBlank() || s.getUser().getRole().name().equalsIgnoreCase(roleFilter)))
            .filter(s -> {
                List<TestRide> conflicts = new ArrayList<>();
                List<TestRide> c1 = testRideRepository.findByAssignedStaffIdAndScheduleDateTimeBetween(
                    s.getId(), start.minusMinutes(1), end.plusMinutes(1));
                if (c1 != null) conflicts.addAll(c1);
                List<TestRide> c2 = testRideRepository.findByAssignedStaffIdAndScheduleDateBetween(
                    s.getId(), start.minusMinutes(1), end.plusMinutes(1));
                if (c2 != null) conflicts.addAll(c2);
                return conflicts.stream().noneMatch(tr ->
                    tr != null && tr.getStatus() != null
                        && tr.getStatus() != TestRideStatus.CANCELLED
                        && tr.getStatus() != TestRideStatus.COMPLETED
                        && tr.getStatus() != TestRideStatus.NO_SHOW
                        && tr.getStatus() != TestRideStatus.EXPIRED
                );
            })
            .toList();
    }

    public TestRide assignStaffToTestRide(String testRideId, String staffId) {
        TestRide testRide = testRideRepository.findById(testRideId)
            .orElseThrow(() -> new ResourceNotFoundException("Test ride not found"));
        Staff staff = staffRepository.findById(staffId)
            .orElseThrow(() -> new ResourceNotFoundException("Staff not found"));
        testRide.setAssignedStaff(staff);
        testRide.setAssignedAt(LocalDateTime.now());
        testRide.setStatus(TestRideStatus.AWAITING_STAFF_CONFIRMATION);
        TestRide saved = testRideRepository.save(testRide);
        notificationService.sendToUser(
            staff.getUser(),
            "New Test Ride Assignment",
            "You have been assigned to a test ride booking.",
            "TEST_RIDE",
            saved.getId()
        );
        notificationService.sendToUser(
            saved.getUser(),
            "Test Ride Assigned",
            "Your test ride booking has been assigned to a staff member.",
            "TEST_RIDE",
            saved.getId()
        );
        emailService.sendStaffAssignedEmail(saved, staff);
        return saved;
    }

    public TestRide updateTestRideStatus(String testRideId, TestRideStatus status) {
        TestRide testRide = testRideRepository.findById(testRideId)
            .orElseThrow(() -> new ResourceNotFoundException("Test ride not found"));
        testRide.setStatus(status);
        if (status == TestRideStatus.CONFIRMED) {
            testRide.setConfirmedAt(LocalDateTime.now());
        } else if (status == TestRideStatus.COMPLETED) {
            testRide.setCompletedAt(LocalDateTime.now());
        }
        return testRideRepository.save(testRide);
    }

    @Transactional
    public TestRide updateTestRideStore(String testRideId, String storeId) {
        TestRide testRide = testRideRepository.findById(testRideId)
            .orElseThrow(() -> new ResourceNotFoundException("Test ride not found"));
        Store store = storeRepository.findById(storeId)
            .orElseThrow(() -> new ResourceNotFoundException("Store not found"));
        testRide.setStore(store);
        return testRideRepository.save(testRide);
    }
    
    // ==================== REVIEW MANAGEMENT ====================
    
    public Page<Review> getAllReviews(int page, int size, Boolean approved) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createAt"));
        
        if (approved != null) {
            return reviewRepository.findByIsApproved(approved, pageable);
        }
        
        return reviewRepository.findAll(pageable);
    }
    
    @Transactional
    public Review approveReview(String reviewId) {
        Review review = reviewRepository.findById(reviewId)
            .orElseThrow(() -> new ResourceNotFoundException("Review not found"));
        
        review.setIsApproved(true);
        return reviewRepository.save(review);
    }
    
    @Transactional
    public Review rejectReview(String reviewId) {
        Review review = reviewRepository.findById(reviewId)
            .orElseThrow(() -> new ResourceNotFoundException("Review not found"));
        
        review.setIsApproved(false);
        return reviewRepository.save(review);
    }
    
    @Transactional
    public void deleteReview(String reviewId) {
        Review review = reviewRepository.findById(reviewId)
            .orElseThrow(() -> new ResourceNotFoundException("Review not found"));
        
        reviewRepository.delete(review);
    }
    
    @Transactional
    public Review flagReview(String reviewId) {
        Review review = reviewRepository.findById(reviewId)
            .orElseThrow(() -> new ResourceNotFoundException("Review not found"));
        
        review.setIsFlagged(true);
        return reviewRepository.save(review);
    }

    public Page<ForumPost> getAllForumPosts(int page, int size, String category, String search, Boolean hidden) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createAt"));
        boolean useHidden = hidden != null;
        if (search != null && !search.isBlank()) {
            if (useHidden) {
                return forumPostRepository.findByTitleContainingIgnoreCaseAndIsHidden(search, hidden, pageable);
            }
            return forumPostRepository.findByTitleContainingIgnoreCaseAndIsHiddenFalse(search, pageable);
        }
        if (category != null && !category.isBlank()) {
            if (useHidden) {
                return forumPostRepository.findByCategoryAndIsHidden(category, hidden, pageable);
            }
            return forumPostRepository.findByCategoryAndIsHiddenFalse(category, pageable);
        }
        if (useHidden) {
            return forumPostRepository.findByIsHidden(hidden, pageable);
        }
        return forumPostRepository.findByIsHiddenFalse(pageable);
    }

    @Transactional
    public ForumPost setForumPostHot(String id, boolean hot) {
        ForumPost post = forumPostRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Forum post not found"));
        post.setIsHot(hot);
        return forumPostRepository.save(post);
    }

    @Transactional
    public ForumPost setForumPostHidden(String id, boolean hidden) {
        ForumPost post = forumPostRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Forum post not found"));
        post.setIsHidden(hidden);
        return forumPostRepository.save(post);
    }

    @Transactional
    public void deleteForumPost(String id) {
        ForumPost post = forumPostRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Forum post not found"));
        forumPostRepository.delete(post);
    }

    // ==================== FORUM COMMENT MODERATION ====================
    @Transactional
    public ForumComment setForumCommentHidden(String id, boolean hidden) {
        ForumComment comment = forumCommentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Forum comment not found"));
        comment.setIsHidden(hidden);
        return forumCommentRepository.save(comment);
    }

    @Transactional
    public ForumComment flagForumComment(String id) {
        ForumComment comment = forumCommentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Forum comment not found"));
        comment.setIsFlagged(true);
        return forumCommentRepository.save(comment);
    }

    @Transactional
    public void deleteForumComment(String id) {
        ForumComment comment = forumCommentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Forum comment not found"));
        forumCommentRepository.delete(comment);
    }

    public org.springframework.data.domain.Page<ForumComment> getForumCommentsByPost(String postId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "createAt"));
        return forumCommentRepository.findByPostId(postId, pageable);
    }
}
