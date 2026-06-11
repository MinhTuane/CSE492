package com.capstone.mbservices.config;

import com.capstone.mbservices.entity.*;
import com.capstone.mbservices.enums.*;
import com.capstone.mbservices.repository.*;
import com.capstone.mbservices.repository.AccessoryRepository;
import com.capstone.mbservices.entity.Accessory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.ArrayList;
import java.util.List;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final MotorcycleRepository motorcycleRepository;
    private final OrderRepository orderRepository;
    private final ReviewRepository reviewRepository;
    private final TestRideRepository testRideRepository;
    private final MaintenanceServiceRepository maintenanceServiceRepository;
    private final StaffRepository staffRepository;
    private final StoreRepository storeRepository;
    private final ForumPostRepository forumPostRepository;
    private final ForumCommentRepository forumCommentRepository;
    private final ServiceOfferingRepository serviceOfferingRepository;
    private final AccessoryRepository accessoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.capstone.mbservices.service.CloudinaryService cloudinaryService;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        ensureAdminExists();
        User customer = createOrGetUser("customer@test.com", "John", "Doe", "CUSTOMER");
        User customer1 = createOrGetUser("customer1@gmail.com", "Minh", "Nguyen", "CUSTOMER");
        User admin = createOrGetUser("admin@test.com", "Admin", "User", "ADMIN");
        User staff = createOrGetUser("staff@test.com", "Staff", "Member", "STAFF");

        ensureEncodedPassword(staff, "password123");

        if (storeRepository.count() == 0) {
            Store store1 = storeRepository.save(Store.builder()
                .name("MBServices Thu Dau Mot")
                .address("Dai lo Binh Duong, Phu Hoa, Thu Dau Mot, Binh Duong")
                .phone("0900123456")
                .latitude(10.9804)
                .longitude(106.6519)
                .brand("YAMAHA")
                .licensed(true)
                .contractStart(java.time.LocalDate.now())
                .contractEnd(java.time.LocalDate.now().plusYears(3))
                .build());
            Store store2 = storeRepository.save(Store.builder()
                .name("MBServices Thanh Pho Moi")
                .address("Duong Le Loi, Phuong Hoa Phu, TP Moi Binh Duong")
                .phone("0900654321")
                .latitude(11.0480)
                .longitude(106.6685)
                .brand("HONDA")
                .licensed(true)
                .contractStart(java.time.LocalDate.now())
                .contractEnd(java.time.LocalDate.now().plusYears(3))
                .build());
            Store store3 = storeRepository.save(Store.builder()
                .name("MBServices Phu Loi")
                .address("Duong Phu Loi, Thu Dau Mot, Binh Duong")
                .phone("0900987654")
                .latitude(10.9902)
                .longitude(106.6710)
                .brand("SUZUKI")
                .licensed(true)
                .contractStart(java.time.LocalDate.now())
                .contractEnd(java.time.LocalDate.now().plusYears(3))
                .build());
            Store store4 = storeRepository.save(Store.builder()
                .name("MBServices Ben Cat")
                .address("Quoc lo 13, My Phuoc, Ben Cat, Binh Duong")
                .phone("0900112233")
                .latitude(11.1111)
                .longitude(106.6083)
                .brand("HONDA")
                .licensed(true)
                .contractStart(java.time.LocalDate.now())
                .contractEnd(java.time.LocalDate.now().plusYears(3))
                .build());
        }

        if (!staffRepository.existsByUser(staff)) {
            Staff staffMember = Staff.builder()
                    .user(staff)
                    .permissions(Arrays.asList("MANAGE_ORDERS", "MANAGE_SERVICES"))
                    .store(storeRepository.findAll().stream().findFirst().orElse(null))
                    .build();
            staffRepository.save(staffMember);
            log.info("Created staff member for: {}", staff.getEmail());
        }

        List<Motorcycle> motorcycles = new ArrayList<>();
        boolean needMotorcycles = motorcycleRepository.count() != 50;

        if (needMotorcycles && motorcycleRepository.count() > 0) {
            log.info("Refreshing database with the new 50 multi-image motorcycles...");
            try {
                jdbcTemplate.update("DELETE FROM order_items WHERE item_type = 'MOTORCYCLE'");
                jdbcTemplate.update("DELETE FROM order_items WHERE motorcycle_id IS NOT NULL");
                jdbcTemplate.update("DELETE FROM order_items");
                orderRepository.deleteAll();
                reviewRepository.deleteAll();
                testRideRepository.deleteAll();
                maintenanceServiceRepository.deleteAll();
                motorcycleRepository.deleteAll();
            } catch (Exception e) {
                log.warn("Failed to clear motorcycle dependencies: {}", e.getMessage());
            }
        }

        if (needMotorcycles) {
            try {
                java.io.File localFile = new java.io.File("src/main/resources/motorcycles.json");
                ObjectMapper mapper = new ObjectMapper();
                if (localFile.exists()) {
                    motorcycles = mapper.readValue(localFile, new TypeReference<List<Motorcycle>>() {});
                    log.info("Loaded {} motorcycles from local file motorcycles.json", motorcycles.size());
                    log.info("Uploading motorcycle images to Cloudinary in parallel...");
                    motorcycles.parallelStream().forEach(m -> {
                        m.setImages(toCloudinaryUrls(m.getBrand(), m.getModel(), m.getImages(), "motorcycles"));
                    });
                } else {
                    org.springframework.core.io.ClassPathResource resource = new org.springframework.core.io.ClassPathResource("motorcycles.json");
                    if (resource.exists()) {
                        try (java.io.InputStream is = resource.getInputStream()) {
                            motorcycles = mapper.readValue(is, new TypeReference<List<Motorcycle>>() {});
                            log.info("Loaded {} motorcycles from classpath motorcycles.json", motorcycles.size());
                            log.info("Uploading motorcycle images to Cloudinary in parallel...");
                            motorcycles.parallelStream().forEach(m -> {
                                m.setImages(toCloudinaryUrls(m.getBrand(), m.getModel(), m.getImages(), "motorcycles"));
                            });
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to read motorcycles.json, using hardcoded fallback: {}", e.getMessage());
            }

            if (motorcycles == null || motorcycles.isEmpty()) {
                log.info("Seeding database with 32 fallback motorcycles...");
                motorcycles = new ArrayList<>();
            // ============ YAMAHA (3) ============
        motorcycles.add(createMotorcycle(
            "YAMAHA", "YZF-R3", 2024, "Sport", 129000000.0,
            "Yamaha R3 with custom black, blue, and gold livery. Perfect entry-level sportbike.",
            "321cc Parallel Twin", 321, 42.0, 39.7, 169.0, 186.0, 14.0, 8,
            Arrays.asList("/images/motorcycles/rbk-t1-yamaha-r3-black-blue-gold-render.webp"),
            Arrays.asList("Slipper Clutch", "LED Lighting", "Digital Display", "ABS"),
            "Black/Blue/Gold"
        ));

        motorcycles.add(createMotorcycle(
            "YAMAHA", "YZF-R1", 2025, "Sport", 549000000.0,
            "2025 Yamaha YZF-R1 in Tech Black. The pinnacle of superbike performance.",
            "998cc Inline-4", 998, 200.0, 112.4, 199.0, 299.0, 17.0, 3,
            Arrays.asList("/images/motorcycles/2025-Yamaha-YZF1000R1COMP-EU-Tech_Black-360-Degrees-001-03_Mobile.jpg"),
            Arrays.asList("Crossplane Engine", "6-Axis IMU", "Quickshifter", "Cornering ABS", "Traction Control"),
            "Tech Black"
        ));

        motorcycles.add(createMotorcycle(
            "YAMAHA", "YZF-R1 WorldSBK", 2025, "Sport", 679000000.0,
            "Yamaha YZF-R1 WorldSBK Edition with Pata Yamaha racing livery. Limited edition.",
            "998cc Inline-4", 998, 200.0, 112.4, 199.0, 299.0, 17.0, 2,
            Arrays.asList("/images/motorcycles/Yamaha_Racing_WorldSBK_2025_YZF-R1_Jonathan_Rea_139.jpg"),
            Arrays.asList("Racing Livery", "Öhlins Suspension", "Akrapovic Exhaust", "Carbon Fiber Parts"),
            "Pata Blue"
        ));

            // ============ HONDA (3) ============
        motorcycles.add(createMotorcycle(
            "HONDA", "CBR650R", 2024, "Sport", 259000000.0,
            "Honda CBR650R in matte gunpowder black metallic. Perfect mid-weight sportbike.",
            "649cc Inline-4", 649, 95.0, 64.0, 208.0, 230.0, 15.4, 7,
            Arrays.asList("/images/motorcycles/honda-select-model-matte-gunpower-black-metallic-1644556118299.avif"),
            Arrays.asList("Showa Suspension", "ABS", "LED Lighting", "Digital Display"),
            "Matte Gunpowder Black"
        ));

        motorcycles.add(createMotorcycle(
            "HONDA", "CBR Sport Concept", 2024, "Sport", 189000000.0,
            "Honda Light Weight Super Sports Concept. Next-generation sport bike design.",
            "500cc Parallel Twin", 500, 47.0, 43.0, 166.0, 200.0, 13.0, 10,
            Arrays.asList("/images/motorcycles/Honda-Light-Weight-Super-Sports-Concept-scaled.webp"),
            Arrays.asList("Concept Design", "LED Matrix", "Ride-by-Wire", "Cornering ABS"),
            "Carbon Black"
        ));

        motorcycles.add(createMotorcycle(
            "HONDA", "CBR1000RR-R", 2026, "Sport", 789000000.0,
            "2026 Honda CBR1000RR-R Fireblade SP in pearl white. Race-bred superbike.",
            "999cc Inline-4", 999, 217.0, 113.0, 201.0, 299.0, 16.1, 4,
            Arrays.asList("/images/motorcycles/2026-cbr1000rr-pearl_white-1505x923.avif"),
            Arrays.asList("Öhlins Electronic Suspension", "Brembo Stylema Brakes", "Quickshifter", "Launch Control"),
            "Pearl White"
        ));

            // ============ KAWASAKI (8) ============
        motorcycles.add(createMotorcycle(
            "KAWASAKI", "Ninja ZX-10RR", 2017, "Sport", 589000000.0,
            "2017 Kawasaki Ninja ZX-10RR Winter Test Edition. Track-focused superbike.",
            "998cc Inline-4", 998, 197.0, 114.0, 207.0, 299.0, 17.0, 2,
            Arrays.asList("/images/motorcycles/2017-Kawasaki-Ninja-ZX-10RR-04-scaled.webp"),
            Arrays.asList("Race Kit", "Öhlins Suspension", "Marchesini Wheels", "Quickshifter"),
            "Black/Green"
        ));

        motorcycles.add(createMotorcycle(
            "KAWASAKI", "Ninja ZX-10R", 2024, "Sport", 529000000.0,
            "Kawasaki Ninja ZX-10R in iconic Kawasaki lime green. Championship-winning DNA.",
            "998cc Inline-4", 998, 197.0, 114.0, 207.0, 299.0, 17.0, 5,
            Arrays.asList("/images/motorcycles/5-111.jpg"),
            Arrays.asList("Kawasaki Traction Control", "Cornering ABS", "Quickshifter", "Launch Control"),
            "Lime Green"
        ));

        motorcycles.add(createMotorcycle(
            "KAWASAKI", "Ninja ZX-10R ABS SE", 2024, "Sport", 549000000.0,
            "Ninja ZX-10R ABS with gold accents and special edition graphics.",
            "998cc Inline-4", 998, 197.0, 114.0, 207.0, 299.0, 17.0, 3,
            Arrays.asList("/images/motorcycles/Kawasaki-Ninja-ZX-10R-ABS-01.jpg"),
            Arrays.asList("Gold Wheels", "SE Graphics", "Öhlins", "Brembo", "Carbon Parts"),
            "Green/Gold"
        ));

        motorcycles.add(createMotorcycle(
            "KAWASAKI", "Ninja 650", 2021, "Sport", 229000000.0,
            "2021 Kawasaki Ninja 650 with signature green trellis frame. Perfect middleweight.",
            "649cc Parallel Twin", 649, 68.0, 64.0, 193.0, 210.0, 15.0, 12,
            Arrays.asList("/images/motorcycles/kawasaki-ninja-650-2021-1-0909.png"),
            Arrays.asList("Slipper Clutch", "ABS", "LED Lighting", "Digital Display"),
            "Black/Green"
        ));

        motorcycles.add(createMotorcycle(
            "KAWASAKI", "Ninja H2R", 2024, "Sport", 1599000000.0,
            "Kawasaki Ninja H2R. Track-only supercharged hyperbike. 300+ hp.",
            "998cc Supercharged Inline-4", 998, 310.0, 165.0, 216.0, 400.0, 17.0, 1,
            Arrays.asList("/images/motorcycles/3dc4ccba-aefc-43e1-aa52-d361b442b781.png"),
            Arrays.asList("Supercharged", "Track Only", "Carbon Fiber Wings", "Öhlins", "Brembo"),
            "Mirror Silver"
        ));

        motorcycles.add(createMotorcycle(
            "KAWASAKI", "Ninja 400", 2024, "Sport", 159000000.0,
            "Kawasaki Ninja 400 in all black. Perfect beginner sportbike with big bike feel.",
            "399cc Parallel Twin", 399, 45.0, 38.0, 168.0, 190.0, 14.0, 15,
            Arrays.asList("/images/motorcycles/e946a82f-6e78-4531-82f2-72cb6699fc58.png"),
            Arrays.asList("Slipper Clutch", "ABS", "LED Lighting", "Assist Clutch"),
            "Metallic Black", 15.0
        ));

        motorcycles.add(createMotorcycle(
            "KAWASAKI", "Z650", 2024, "Naked", 239000000.0,
            "Kawasaki Z650 naked sport with distinctive green accents. Nimble and fun.",
            "649cc Parallel Twin", 649, 68.0, 64.0, 187.0, 200.0, 15.0, 10,
            Arrays.asList("/images/motorcycles/6c343928-3abf-4efb-b71e-656b184f05db.png"),
            Arrays.asList("Sugomi Design", "Slipper Clutch", "ABS", "TFT Display"),
            "Metallic Green"
        ));

        motorcycles.add(createMotorcycle(
            "KAWASAKI", "Ninja 650 Sport", 2024, "Sport", 239000000.0,
            "Kawasaki Ninja 650 in lime green livery. The most popular middleweight sport bike.",
            "649cc Parallel Twin", 649, 68.0, 64.0, 193.0, 210.0, 15.0, 8,
            Arrays.asList("/images/motorcycles/b5da15c5-07b6-400e-b052-7f00eaeaa620.jpg"),
            Arrays.asList("Slipper Clutch", "Kawasaki TRaction Control", "ABS", "LED Lights"),
            "Lime Green"
        ));

            // ============ DUCATI (7) ============
        motorcycles.add(createMotorcycle(
            "DUCATI", "Hypermotard 950", 2024, "Naked", 449000000.0,
            "Ducati Hypermotard 950 in red and white. The ultimate fun machine.",
            "937cc L-Twin", 937, 114.0, 96.0, 178.0, 215.0, 14.5, 6,
            Arrays.asList("/images/motorcycles/a5464a70-17c3-4e09-8877-90fb55f6f38b.webp"),
            Arrays.asList("Ducati Traction Control", "Cornering ABS", "Ride Modes", "TFT Display"),
            "Ducati Red/White"
        ));

        motorcycles.add(createMotorcycle(
            "DUCATI", "Streetfighter V4", 2024, "Naked", 649000000.0,
            "Ducati Streetfighter V4. Fighter of the Year with 208 hp V4 engine.",
            "1103cc V4", 1103, 208.0, 123.0, 178.0, 280.0, 16.0, 3,
            Arrays.asList("/images/motorcycles/Streetfighter.png"),
            Arrays.asList("V4 Engine", "Öhlins", "Brembo Stylema", "Cornering ABS", "Wheelie Control"),
            "Ducati Red"
        ));

        motorcycles.add(createMotorcycle(
            "DUCATI", "Diavel 1260", 2024, "Cruiser", 579000000.0,
            "Ducati Diavel 1260. Power cruiser with 162 hp Testastretta DVT engine.",
            "1262cc L-Twin", 1262, 162.0, 129.0, 247.0, 260.0, 17.0, 4,
            Arrays.asList("/images/motorcycles/The-Ducati-Diavel-1260-and-xDiavel-gear-patrol-jpg.webp"),
            Arrays.asList("DVT Engine", "Cruise Control", "Cornering Lights", "Riding Modes"),
            "Thrilling Black"
        ));

        motorcycles.add(createMotorcycle(
            "DUCATI", "Panigale V4 Bagnaia", 2024, "Sport", 1299000000.0,
            "Ducati Panigale V4 with Bagnaia World Champion livery. Limited edition.",
            "1103cc V4", 1103, 214.0, 124.0, 174.0, 299.0, 16.0, 1,
            Arrays.asList("/images/motorcycles/Panigale-V4-Bagnaia-World-Champion-Model-Preview-1200x800-1.png"),
            Arrays.asList("Race Livery", "Öhlins Smart EC 2.0", "Brembo Stylema R", "Carbon Fiber"),
            "Bagnaia Yellow"
        ));

        motorcycles.add(createMotorcycle(
            "DUCATI", "Supersport 950 S", 2024, "Sport", 489000000.0,
            "Ducati Supersport 950 S in Ducati red. Sport bike comfort meets superbike performance.",
            "937cc L-Twin", 937, 110.0, 93.0, 184.0, 240.0, 16.0, 7,
            Arrays.asList("/images/motorcycles/_3_______Supersport-950-S-MY21-Red-01-Model-Preview-1050x650.png"),
            Arrays.asList("Öhlins Suspension", "Quickshifter", "Riding Modes", "Cornering ABS"),
            "Ducati Red"
        ));

        motorcycles.add(createMotorcycle(
            "DUCATI", "Diavel V4", 2024, "Cruiser", 749000000.0,
            "Ducati Diavel V4 in bright red. The most powerful Diavel ever made.",
            "1158cc V4 Granturismo", 1158, 168.0, 126.0, 218.0, 270.0, 18.0, 3,
            Arrays.asList("/images/motorcycles/Diavel_V4.png"),
            Arrays.asList("V4 Granturismo", "Radar Adaptive Cruise Control", "Cornering Lights", "TFT Display"),
            "Ducati Red"
        ));

        motorcycles.add(createMotorcycle(
            "DUCATI", "Streetfighter V2", 2024, "Naked", 529000000.0,
            "Ducati Streetfighter V2. Compact fighter with 155 hp Superquadro engine.",
            "955cc L-Twin", 955, 155.0, 104.0, 178.0, 250.0, 17.0, 5,
            Arrays.asList("/images/motorcycles/Model-Menu-MY22-HYM-SP-v06.png"),
            Arrays.asList("Superquadro Engine", "Electronic Suspension", "Cornering ABS", "Wheelie Control"),
            "Ducati Red/Black"
        ));

            // ============ SUZUKI (5) ============
        motorcycles.add(createMotorcycle(
            "SUZUKI", "GSX-8R", 2024, "Sport", 329000000.0,
            "Suzuki GSX-8R in yellow limited edition. All-new parallel twin sportbike.",
            "776cc Parallel Twin", 776, 83.0, 78.0, 178.0, 220.0, 14.0, 8,
            Arrays.asList("/images/motorcycles/suzuki_gsx8r_kiirolimitededition_sideon.png"),
            Arrays.asList("New Parallel Twin", "Traction Control", "ABS", "Quickshifter"),
            "Kiiro Yellow"
        ));

        motorcycles.add(createMotorcycle(
            "SUZUKI", "GSX-S1000", 2024, "Naked", 459000000.0,
            "Suzuki GSX-S1000 in blue. Superbike-derived engine in a naked package.",
            "999cc Inline-4", 999, 152.0, 106.0, 209.0, 260.0, 19.0, 6,
            Arrays.asList("/images/motorcycles/fdb74833-7846-466d-ae8f-695796e5cada.jpg"),
            Arrays.asList("GSX-R Derived Engine", "Traction Control", "ABS", "Ride Modes"),
            "Glass Mat Mechanical Gray/Triton Blue Metallic"
        ));

        motorcycles.add(createMotorcycle(
            "SUZUKI", "Hayabusa", 2024, "Sport", 749000000.0,
            "Suzuki Hayabusa in gray/green. The legendary ultimate sport bike returns.",
            "1340cc Inline-4", 1340, 190.0, 150.0, 264.0, 299.0, 20.0, 2,
            Arrays.asList("/images/motorcycles/1107_02.jpg"),
            Arrays.asList("Launch Control", "Anti-Lift Control", "Active Speed Limiter", "Cruise Control"),
            "Metallic Gray/Green"
        ));

        motorcycles.add(createMotorcycle(
            "SUZUKI", "Hayabusa Blue Storm", 2024, "Sport", 769000000.0,
            "Suzuki Hayabusa in Blue Storm metallic. The king of speed with refined power.",
            "1340cc Inline-4", 1340, 190.0, 150.0, 264.0, 299.0, 20.0, 3,
            Arrays.asList("/images/motorcycles/eyJvdXRwdXRGb3JtYXQiOiJqcGciLCJidWNrZXQiOiJ6YWxhLXByb2R1Y3Rpb24iLCJrZXkiOiJhY2NvdW50LTEwMDBcLzE3NTgyMDc4MDE0NDBfMzE2NzU5MVwvSGF5YWJ1c2EuanBnIiwiZWRpdHMiOnsicm90YXRlIjpudWxsLCJyZXNpemUiOnsiaGVpZ2h0Ijo2NDAsIndpZHRoIj.jpg"),
            Arrays.asList("Launch Control", "Electronic Suspension", "Brembo Brakes", "LED Matrix"),
            "Blue Storm Metallic"
        ));

        motorcycles.add(createMotorcycle(
            "SUZUKI", "GSX-R150", 2024, "Sport", 75000000.0,
            "Suzuki GSX-R150 with MotoGP livery. Entry-level sportbike with race DNA.",
            "147cc Single", 147, 19.2, 14.0, 134.0, 145.0, 11.0, 20,
            Arrays.asList("/images/motorcycles/GSX-R150_YSF_Right.webp"),
            Arrays.asList("Keyless Ignition", "LED Lights", "Digital Display", "USD Forks"),
            "MotoGP Blue", 20.0
        ));

            // ============ BMW (3) ============
        motorcycles.add(createMotorcycle(
            "BMW", "R1300 GS", 2024, "Adventure", 829000000.0,
            "BMW R1300 GS in racing green. The ultimate adventure motorcycle.",
            "1300cc Boxer Twin", 1300, 145.0, 149.0, 239.0, 220.0, 19.0, 4,
            Arrays.asList("/images/motorcycles/6000000012.jpg"),
            Arrays.asList("Adaptive Ride Height", "Dynamic ESA", "Cornering ABS", "Radar Cruise Control"),
            "Racing Green"
        ));

        motorcycles.add(createMotorcycle(
            "BMW", "R1250RS", 2024, "Sport Touring", 659000000.0,
            "BMW R1250RS in black. Premium sport touring with boxer engine.",
            "1254cc Boxer Twin", 1254, 136.0, 143.0, 224.0, 220.0, 18.0, 5,
            Arrays.asList("/images/motorcycles/image28.jpg"),
            Arrays.asList("ShiftCam Technology", "Dynamic ESA", "Cruise Control", "Heated Grips"),
            "Black Storm Metallic"
        ));

        motorcycles.add(createMotorcycle(
            "BMW", "M1000R", 2024, "Naked", 749000000.0,
            "BMW M1000R. The first M naked bike with 210 hp from S1000RR.",
            "999cc Inline-4", 999, 210.0, 113.0, 192.0, 280.0, 16.5, 2,
            Arrays.asList("/images/motorcycles/nsc-m1000r-P0N3S-modeloverview_600x360_jpg_asset_1664888615211.avif"),
            Arrays.asList("M Package", "Carbon Wheels", "M Chassis", "Launch Control", "Wheelie Control"),
            "M Motorsport", 10.0
        ));

            // ============ HARLEY-DAVIDSON (3) ============
        motorcycles.add(createMotorcycle(
            "HARLEY-DAVIDSON", "Iron 883", 2024, "Cruiser", 379000000.0,
            "Harley-Davidson Iron 883 in black denim. Classic bobber styling.",
            "883cc V-Twin", 883, 50.0, 69.0, 256.0, 180.0, 12.5, 8,
            Arrays.asList("/images/motorcycles/harley-davidson-motorcycles.webp"),
            Arrays.asList("Evolution Engine", "Low Seat Height", "Chopped Fenders", "Dark Custom"),
            "Black Denim"
        ));

        motorcycles.add(createMotorcycle(
            "HARLEY-DAVIDSON", "Street Bob 114", 2024, "Cruiser", 649000000.0,
            "Harley-Davidson Street Bob 114 in red. Milwaukee-Eight 114 power.",
            "1868cc V-Twin", 1868, 94.0, 155.0, 296.0, 190.0, 13.6, 5,
            Arrays.asList("/images/motorcycles/Screenshot-1.webp"),
            Arrays.asList("Milwaukee-Eight 114", "Inverted Forks", "Monoshock", "LED Lights"),
            "Billiard Red"
        ));

        motorcycles.add(createMotorcycle(
            "HARLEY-DAVIDSON", "Low Rider S", 2024, "Cruiser", 699000000.0,
            "Harley-Davidson Low Rider S in vivid black. High-performance cruiser.",
            "1923cc V-Twin", 1923, 92.0, 161.0, 302.0, 185.0, 18.9, 4,
            Arrays.asList("/images/motorcycles/images.jpg"),
            Arrays.asList("Milwaukee-Eight 117", "Screamin' Eagle", "Premium Suspension", "Touring Ready"),
            "Vivid Black"
        ));
            }

            motorcycleRepository.saveAll(motorcycles);
            log.info("Successfully seeded {} motorcycles!", motorcycles.size());
        } else {
            motorcycles = motorcycleRepository.findAll();
            log.info("Database already seeded with motorcycles! Applying discount updates...");
            try {
                jdbcTemplate.update("UPDATE motorcycles SET discount_percentage = 15.0 WHERE brand = 'KAWASAKI' AND model = 'Ninja 400'");
                jdbcTemplate.update("UPDATE motorcycles SET discount_percentage = 10.0 WHERE brand = 'BMW' AND model = 'M1000R'");
                jdbcTemplate.update("UPDATE motorcycles SET discount_percentage = 20.0 WHERE brand = 'SUZUKI' AND model = 'GSX-R150'");
            } catch (Exception e) {
                log.warn("Failed to apply discount updates: {}", e.getMessage());
            }
        }

        if (orderRepository.count() == 0) {
            createSampleOrders(customer, customer1, motorcycles);
        }
        if (reviewRepository.count() == 0) {
            createSampleReviews(customer, customer1, motorcycles);
        }
        if (testRideRepository.count() == 0 && maintenanceServiceRepository.count() == 0) {
            createSampleBookings(customer, customer1, motorcycles);
        }
        if (serviceOfferingRepository.count() == 0) {
            createSampleServiceOfferings();
        }
        boolean hasPremiumPkl = accessoryRepository.findAll().stream()
                .anyMatch(a -> a.getName().contains("Supercorsa V3"));
        boolean hasLocalAccessoryImg = accessoryRepository.findAll().stream()
                .anyMatch(a -> a.getImageUrl() != null && a.getImageUrl().startsWith("/images/"));
        if (!hasPremiumPkl || hasLocalAccessoryImg) {
            try {
                // Clear order items referencing accessories first to avoid FK constraints
                jdbcTemplate.update("DELETE FROM order_items WHERE item_type = 'ACCESSORY'");
                accessoryRepository.deleteAll();
                createSampleAccessories();
            } catch (Exception e) {
                log.warn("Failed to reset and seed new accessories: {}", e.getMessage());
            }
        }
        createSampleForumPosts(customer, customer1, admin);
    }

    private void ensureEncodedPassword(User user, String plainPassword) {
        if (user == null) return;
        String pwd = user.getPassword();
        boolean isBcrypt = pwd != null && (pwd.startsWith("$2a$") || pwd.startsWith("$2b$") || pwd.startsWith("$2y$"));
        if (!isBcrypt) {
            user.setPassword(passwordEncoder.encode(plainPassword));
            userRepository.save(user);
            log.info("🔒 Updated password hash for {}", user.getEmail());
        }
    }

    private void createSampleAccessories() {
        log.info("Seeding accessories...");
        List<Accessory> accessories = null;
        try {
            java.io.File localFile = new java.io.File("src/main/resources/accessories.json");
            ObjectMapper mapper = new ObjectMapper();
            if (localFile.exists()) {
                accessories = mapper.readValue(localFile, new TypeReference<List<Accessory>>() {});
                log.info("Loaded {} accessories from local file accessories.json", accessories.size());
            } else {
                org.springframework.core.io.ClassPathResource resource = new org.springframework.core.io.ClassPathResource("accessories.json");
                if (resource.exists()) {
                    try (java.io.InputStream is = resource.getInputStream()) {
                        accessories = mapper.readValue(is, new TypeReference<List<Accessory>>() {});
                        log.info("Loaded {} accessories from classpath accessories.json", accessories.size());
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to read accessories.json, falling back to default accessories: {}", e.getMessage());
        }

        if (accessories == null || accessories.isEmpty()) {
            log.info("Using hardcoded fallback accessories.");
            accessories = Arrays.asList(
                Accessory.builder()
                    .name("Pirelli Diablo Supercorsa V3 TD Tire Set")
                    .description("Premium high-performance track day tires offering extreme cornering grip and top-tier durability at high speeds.")
                    .price(9500000.0)
                    .stock(15)
                    .category("Tires")
                    .brand("Pirelli")
                    .imageUrl("/images/accessories/pirelli_diablo_tire.png")
                    .compatibleBikes("Yamaha YZF-R1, Yamaha YZF-R1 WorldSBK, Honda CBR1000RR-R, Kawasaki Ninja ZX-10R, Kawasaki Ninja ZX-10RR, Ducati Panigale V4 Bagnaia, Suzuki Hayabusa, BMW M1000R")
                    .isActive(true)
                    .build(),
                Accessory.builder()
                    .name("Akrapovic Evolution Line Titanium Exhaust")
                    .description("Full racing exhaust crafted from ultra-lightweight titanium. Delivers remarkable power gains and the iconic Akrapovic rumble.")
                    .price(68000000.0)
                    .stock(5)
                    .category("Exhaust")
                    .brand("Akrapovic")
                    .imageUrl("/images/accessories/akrapovic_exhaust.png")
                    .compatibleBikes("Kawasaki Ninja H2R, Yamaha YZF-R1, Honda CBR1000RR-R, Ducati Panigale V4 Bagnaia, BMW M1000R")
                    .isActive(true)
                    .build(),
                Accessory.builder()
                    .name("Ohlins TTX GP Rear Shock Absorber")
                    .description("Rear suspension with twin-tube TTX technology. Provides unmatched traction control and high-speed stability.")
                    .price(38000000.0)
                    .stock(8)
                    .category("Suspension")
                    .brand("Ohlins")
                    .imageUrl("/images/accessories/ohlins_rear_shock.png")
                    .compatibleBikes("Ducati Panigale V4 Bagnaia, Ducati Streetfighter V4, Yamaha YZF-R1, Kawasaki Ninja ZX-10R, Honda CBR1000RR-R, BMW M1000R")
                    .isActive(true)
                    .build(),
                Accessory.builder()
                    .name("DID 525 VX3 Gold Chain & JT Steel Sprocket Kit")
                    .description("Premium gold chain with patented X-Ring seals for minimal friction. Combined with laser-cut JT carbon steel sprockets.")
                    .price(2800000.0)
                    .stock(20)
                    .category("Chains & Sprockets")
                    .brand("DID")
                    .imageUrl("/images/accessories/did_sprocket_chain.png")
                    .compatibleBikes("Honda CBR650R, Kawasaki Ninja 650, Kawasaki Z650, Yamaha YZF-R3, Kawasaki Ninja 400, Suzuki GSX-8R")
                    .isActive(true)
                    .build(),
                Accessory.builder()
                    .name("Rizoma Sport CNC Frame Sliders Set")
                    .description("Chassis protection machined from premium billet aluminum and Delrin. Protects engine cases and frame during falls.")
                    .price(4800000.0)
                    .stock(12)
                    .category("Frame Sliders")
                    .brand("Rizoma")
                    .imageUrl("/images/accessories/rizoma_frame_sliders.png")
                    .compatibleBikes("Kawasaki Ninja 400, Yamaha YZF-R3, Honda CBR650R, Ducati Streetfighter V4, Ducati Streetfighter V2, Suzuki GSX-8R, Suzuki GSX-S1000")
                    .isActive(true)
                    .build(),
                Accessory.builder()
                    .name("Brembo GP4-RX CNC Radial Brake Calipers")
                    .description("Nickel-plated radial racing calipers machined from solid aluminum for extreme stopping force and heat dissipation.")
                    .price(45000000.0)
                    .stock(4)
                    .category("Brakes")
                    .brand("Brembo")
                    .imageUrl("/images/accessories/brembo_gp4rx.png")
                    .compatibleBikes("Yamaha YZF-R1, Honda CBR1000RR-R, Kawasaki Ninja ZX-10R, Ducati Panigale V4 Bagnaia, Suzuki Hayabusa, BMW M1000R")
                    .isActive(true)
                    .build(),
                Accessory.builder()
                    .name("Shoei X-Fifteen Professional Racing Helmet")
                    .description("FIM-certified racing helmet with advanced aerodynamics, high-flow cooling channels and optimal field of view.")
                    .price(21500000.0)
                    .stock(10)
                    .category("Helmets & Gear")
                    .brand("Shoei")
                    .imageUrl("/images/accessories/shoei_x15.png")
                    .compatibleBikes("Universal Fit")
                    .isActive(true)
                    .build(),
                Accessory.builder()
                    .name("Dainese Mugello 3 D-Air Leather Racing Suit")
                    .description("Elite one-piece leather racing suit with integrated D-Air airbag protection system and titanium plates.")
                    .price(85000000.0)
                    .stock(3)
                    .category("Helmets & Gear")
                    .brand("Dainese")
                    .imageUrl("/images/accessories/dainese_mugello.png")
                    .compatibleBikes("Universal Fit")
                    .isActive(true)
                    .build()
            );
        }
        log.info("Uploading accessory images to Cloudinary in parallel...");
        accessories.parallelStream().forEach(a -> {
            String cUrl = toAccessoryCloudinaryUrl(a);
            if (cUrl != null) {
                a.setImageUrl(cUrl);
            }
        });
        accessoryRepository.saveAll(accessories);
        log.info("Seeded {} accessories", accessories.size());
    }
    private void createSampleServiceOfferings() {
        List<Store> stores = storeRepository.findAll();
        Store store1 = stores.stream().findFirst().orElse(null);
        Store store2 = stores.size() > 1 ? stores.get(1) : store1;
        List<ServiceOffering> offerings = new ArrayList<>();
        if (store1 != null) {
            offerings.add(ServiceOffering.builder()
                .name("Basic Oil Change")
                .subtitle("Standard engine oil replacement")
                .description("Full synthetic oil change and basic chain cleaning. Keeps your engine running smoothly.")
                .price(150_000L)
                .features(Arrays.asList(
                    "Premium Synthetic Oil",
                    "Chain Cleaning",
                    "Tire Pressure Check",
                    "Service Report"
                ))
                .active(true)
                .store(store1)
                .build());
            offerings.add(ServiceOffering.builder()
                .name("General Inspection")
                .subtitle("Comprehensive bike checkup")
                .description("A full diagnostic check including brakes, suspension, electrical systems, and fluid levels.")
                .price(300_000L)
                .features(Arrays.asList(
                    "Brake Inspection",
                    "Suspension Check",
                    "Electrical Diagnostics",
                    "Fluid Top-off",
                    "Chain Adjustment"
                ))
                .active(true)
                .store(store1)
                .build());
            offerings.add(ServiceOffering.builder()
                .name("Premium Care & Wash")
                .subtitle("Detailed maintenance and spa")
                .description("Includes general inspection plus detailed wash, polish, brake fluid replacement, and coolant top-off.")
                .price(1_500_000L)
                .features(Arrays.asList(
                    "General Inspection",
                    "Detailed Wash & Wax",
                    "Brake Fluid Replacement",
                    "Coolant Flush",
                    "Performance Tuning"
                ))
                .active(true)
                .store(store1)
                .build());
        }
        if (store2 != null) {
            offerings.add(ServiceOffering.builder()
                .name("Brake Pad Replacement")
                .subtitle("Front and rear brake pads")
                .description("Replacement of brake pads with high-quality materials and caliper cleaning.")
                .price(450_000L)
                .features(Arrays.asList(
                    "Brake Pad Replacement",
                    "Caliper Cleaning",
                    "Brake Fluid Check",
                    "Safety Test"
                ))
                .active(true)
                .store(store2)
                .build());
            offerings.add(ServiceOffering.builder()
                .name("Tire Replacement")
                .subtitle("Professional tire mounting")
                .description("Tire mounting, dynamic balancing, and wheel alignment (Tire cost not included).")
                .price(250_000L)
                .features(Arrays.asList(
                    "Tire Mounting",
                    "Wheel Balancing",
                    "Alignment Check",
                    "Valve Stem Check"
                ))
                .active(true)
                .store(store2)
                .build());
        }
        if (!offerings.isEmpty()) {
            serviceOfferingRepository.saveAll(offerings);
            log.info("Seeded {} service offerings", offerings.size());
        }
    }

    private void ensureAdminExists() {
        String adminEmail = "admin@test.com";
        
        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = User.builder()
                    .email(adminEmail)
                    .password(passwordEncoder.encode("admin123"))
                    .firstname("Admin")
                    .lastname("User")
                    .phone("0903234567")
                    .address("123 Main St, HCMC")
                    .authProvider("LOCAL")
                    .hasLocalCredentials(true)
                    .role(UserRole.ADMIN)
                    .isActive(true)
                    .createAt(LocalDateTime.now())
                    .updateAt(LocalDateTime.now())
                    .build();
            
            userRepository.save(admin);
            log.info("✅ Created admin user: {} / admin123", adminEmail);
        } else {
            userRepository.findByEmail(adminEmail).ifPresent(existing -> {
                boolean changed = false;
                if (existing.getAuthProvider() == null || existing.getAuthProvider().isBlank()) {
                    existing.setAuthProvider("LOCAL");
                    changed = true;
                }
                if (existing.getHasLocalCredentials() == null || !existing.getHasLocalCredentials()) {
                    existing.setHasLocalCredentials(true);
                    changed = true;
                }
                if (changed) {
                    userRepository.save(existing);
                }
            });
            log.info("✅ Admin user already exists: {}", adminEmail);
        }
    }

    // ✅ NEW METHOD: Create user or get existing
    private User createOrGetUser(String email, String firstName, String lastName, String role) {
        return userRepository.findByEmail(email)
                .map(existing -> {
                    boolean changed = false;
                    if (existing.getAuthProvider() == null || existing.getAuthProvider().isBlank()) {
                        existing.setAuthProvider("LOCAL");
                        changed = true;
                    }
                    if (existing.getHasLocalCredentials() == null) {
                        existing.setHasLocalCredentials(true);
                        changed = true;
                    }
                    if (changed) {
                        return userRepository.save(existing);
                    }
                    return existing;
                })
                .orElseGet(() -> {
                    User user = User.builder()
                            .email(email)
                            .password(passwordEncoder.encode("password123"))
                            .firstname(firstName)
                            .lastname(lastName)
                            .phone("0903234567")
                            .address("123 Main St, HCMC")
                            .authProvider("LOCAL")
                            .hasLocalCredentials(true)
                            .role(UserRole.valueOf(role))
                            .isActive(true)
                            .createAt(LocalDateTime.now())
                            .updateAt(LocalDateTime.now())
                            .build();
                    
                    User saved = userRepository.save(user);
                    log.info("Created user: {} with role: {}", email, role);
                    return saved;
                });
    }

    // Keep old method for backwards compatibility
    private User createUser(String email, String firstName, String lastName, String role) {
        return userRepository.save(User.builder()
                .email(email)
                .password(passwordEncoder.encode("password123"))
                .firstname(firstName)
                .lastname(lastName)
                .phone("0903234567")
                .address("123 Main St, HCMC")
                .role(UserRole.valueOf(role))
                .isActive(true)
                .createAt(LocalDateTime.now())
                .updateAt(LocalDateTime.now())
                .build());
    }

    private Motorcycle createMotorcycle(String brand, String model, int year, String category,
                                       double price, String description, String engineType,
                                       int displacement, double power, double torque, double weight,
                                       double topSpeed, double fuelCapacity, int stock,
                                       List<String> images, List<String> features, String color, double discountPercentage) {
        List<String> cloudinaryImages = toCloudinaryUrls(brand, model, images, "motorcycles");
        return Motorcycle.builder()
                .brand(brand)
                .model(model)
                .year(year)
                .category(category)
                .price(price)
                .discountPercentage(discountPercentage)
                .status(MotorcycleStatus.AVAILABLE)
                .description(description)
                .engineType(engineType)
                .displacement(displacement)
                .power(power)
                .torque(torque)
                .weight(weight)
                .topSpeed(topSpeed)
                .fuelCapacity(fuelCapacity)
                .stock(stock)
                .images(cloudinaryImages)
                .features(features)
                .color(color)
                .build();
    }

    private Motorcycle createMotorcycle(String brand, String model, int year, String category,
                                       double price, String description, String engineType,
                                       int displacement, double power, double torque, double weight,
                                       double topSpeed, double fuelCapacity, int stock,
                                       List<String> images, List<String> features, String color) {
        return createMotorcycle(brand, model, year, category, price, description, engineType,
                displacement, power, torque, weight, topSpeed, fuelCapacity, stock,
                images, features, color, 0.0);
    }
    
    private String slugify(String input) {
        if (input == null) return "";
        return input.toLowerCase()
                .replaceAll("[^a-z0-9]+", "_")
                .replaceAll("^_+|_+$", "");
    }

    private String uploadImageToCloudinary(String imagePath, String folder, String customPublicId) {
        if (imagePath == null || imagePath.isBlank()) return null;
        try {
            boolean isRemote = imagePath.toLowerCase().startsWith("http://") 
                    || imagePath.toLowerCase().startsWith("https://") 
                    || imagePath.toLowerCase().startsWith("//");
            
            if (isRemote) {
                log.info("Uploading remote URL to Cloudinary: {} with public_id: {}", imagePath, customPublicId);
                return cloudinaryService.uploadUrlWithPublicId(imagePath, folder, customPublicId);
            }
            
            String localPath = imagePath.startsWith("/") ? imagePath : "/" + imagePath;
            String fullPath = "src/main/resources/static" + localPath;
            java.io.File file = new java.io.File(fullPath);
            
            if (file.exists()) {
                byte[] bytes = java.nio.file.Files.readAllBytes(file.toPath());
                log.info("Uploading local file to Cloudinary: {} with public_id: {}", fullPath, customPublicId);
                return cloudinaryService.uploadBytesWithPublicId(bytes, folder, customPublicId);
            } else {
                org.springframework.core.io.ClassPathResource resource = new org.springframework.core.io.ClassPathResource("static" + localPath);
                if (resource.exists()) {
                    try (java.io.InputStream is = resource.getInputStream()) {
                        byte[] bytes = is.readAllBytes();
                        log.info("Uploading classpath file to Cloudinary: static{} with public_id: {}", localPath, customPublicId);
                        return cloudinaryService.uploadBytesWithPublicId(bytes, folder, customPublicId);
                    }
                }
            }
            log.warn("Local file not found for seeding: {}", fullPath);
            return imagePath;
        } catch (Exception e) {
            log.error("Failed to seed image to Cloudinary ({}): {}", imagePath, e.getMessage());
            return imagePath;
        }
    }

    private List<String> toCloudinaryUrls(String brand, String model, List<String> imgs, String folder) {
        if (imgs == null || imgs.isEmpty()) return java.util.Collections.emptyList();
        List<String> out = new java.util.ArrayList<>();
        for (int i = 0; i < imgs.size(); i++) {
            String url = imgs.get(i);
            if (url == null || url.isBlank()) continue;
            
            String baseName = slugify(brand) + "_" + slugify(model) + "_" + (i + 1);
            String publicId = "seed_motorcycle_" + baseName;
            
            String cloudinaryUrl = uploadImageToCloudinary(url, folder, publicId);
            if (cloudinaryUrl != null) {
                out.add(cloudinaryUrl);
            } else {
                out.add(url);
            }
        }
        return out;
    }

    private String toAccessoryCloudinaryUrl(Accessory accessory) {
        if (accessory.getImageUrl() == null || accessory.getImageUrl().isBlank()) return null;
        
        String baseName = slugify(accessory.getBrand()) + "_" + slugify(accessory.getName());
        if (baseName.length() > 80) {
            baseName = baseName.substring(0, 80);
        }
        String publicId = "seed_accessory_" + baseName;
        
        return uploadImageToCloudinary(accessory.getImageUrl(), "accessories", publicId);
    }

    private void createSampleOrders(User customer, User customer1, List<Motorcycle> motorcycles) {
        if (motorcycles.size() < 3) return;

        Order order1 = Order.builder()
                .orderNumber("ORD-" + System.currentTimeMillis())
                .user(customer)
                .motorcycles(Arrays.asList(motorcycles.get(0)))
                .totalAmount(motorcycles.get(0).getPrice())
                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                .transactionId("TXN-" + System.currentTimeMillis())
                .status(OrderStatus.DELIVERED)
                .createAt(LocalDateTime.now().minusDays(5))
                .build();

        Order order2 = Order.builder()
                .orderNumber("ORD-" + (System.currentTimeMillis() + 1))
                .user(customer1)
                .motorcycles(Arrays.asList(motorcycles.get(1)))
                .totalAmount(motorcycles.get(1).getPrice())
                .paymentMethod(PaymentMethod.CASH)
                .status(OrderStatus.PROCESSING)
                .createAt(LocalDateTime.now().minusDays(2))
                .build();

        orderRepository.saveAll(Arrays.asList(order1, order2));
    }

    private void createSampleReviews(User customer, User customer1, List<Motorcycle> motorcycles) {
        if (motorcycles.size() < 5) return;

        Review review1 = Review.builder()
                .user(customer)
                .motorcycle(motorcycles.get(0))
                .rating(5)
                .title("Amazing bike!")
                .content("Perfect for daily riding and weekend fun. Highly recommended!")
                .isApproved(true)
                .createAt(LocalDateTime.now().minusDays(3))
                .build();

        Review review2 = Review.builder()
                .user(customer1)
                .motorcycle(motorcycles.get(1))
                .rating(5)
                .title("Best superbike ever!")
                .content("Incredible power and handling. Worth every penny!")
                .isApproved(true)
                .createAt(LocalDateTime.now().minusDays(1))
                .build();

        reviewRepository.saveAll(Arrays.asList(review1, review2));
    }

    private void createSampleBookings(User customer, User customer1, List<Motorcycle> motorcycles) {
        if (motorcycles.size() < 4) return;
        List<Store> stores = storeRepository.findAll();
        Store store1 = stores.stream().findFirst().orElse(null);
        Store store2 = stores.size() > 1 ? stores.get(1) : store1;
        Staff anyStaff = staffRepository.findAll().stream().findFirst().orElse(null);

        TestRide testRide1 = TestRide.builder()
                .user(customer)
                .motorcycle(motorcycles.get(2))
                .scheduleDate(LocalDateTime.now().plusDays(3))
                .scheduleDateTime(LocalDateTime.now().plusDays(3))
                .duration(30)
                .status(TestRideStatus.PENDING)
                .location("HCMC Showroom")
                .store(store1)
                .createAt(LocalDateTime.now())
                .build();

        TestRide testRide2 = TestRide.builder()
                .user(customer1)
                .motorcycle(motorcycles.get(3))
                .scheduleDate(LocalDateTime.now().plusDays(5))
                .scheduleDateTime(LocalDateTime.now().plusDays(5))
                .duration(60)
                .status(TestRideStatus.CONFIRMED)
                .location("Hanoi Showroom")
                .confirmedAt(LocalDateTime.now())
                .assignedStaff(anyStaff)
                .assignedAt(LocalDateTime.now())
                .store(store2)
                .createAt(LocalDateTime.now().minusDays(1))
                .build();

        MaintenanceService service1 = MaintenanceService.builder()
                .user(customer)
                .motorcycle(motorcycles.get(0))
                .serviceType("Oil Change")
                .description("Full oil change and filter replacement")
                .scheduleDate(LocalDateTime.now().plusDays(7))
                .status(ServiceStatus.SCHEDULED)
                .cost(1500000.0)
                .createAt(LocalDateTime.now())
                .build();

        MaintenanceService service2 = MaintenanceService.builder()
                .user(customer1)
                .motorcycle(motorcycles.get(1))
                .serviceType("Brake Inspection")
                .description("Full brake system inspection and pad replacement")
                .scheduleDate(LocalDateTime.now().plusDays(10))
                .status(ServiceStatus.IN_PROGRESS)
                .cost(2500000.0)
                .createAt(LocalDateTime.now().minusDays(2))
                .build();

        testRideRepository.saveAll(Arrays.asList(testRide1, testRide2));
        maintenanceServiceRepository.saveAll(Arrays.asList(service1, service2));
    }

    private void createSampleForumPosts(User customer, User customer1, User admin) {
        List<ForumPost> forumPosts;
        if (forumPostRepository.count() == 0) {
            log.info("Seeding forum posts...");
            forumPosts = Arrays.asList(
                ForumPost.builder()
                    .user(customer)
                    .title("Best entry-level sportbike?")
                    .content("I'm looking for a good entry-level sportbike under 150 million VND. Any recommendations?")
                    .category("newriders")
                    .isHot(false)
                    .isHidden(false)
                    .likesCount(5)
                    .commentsCount(3)
                    .createAt(LocalDateTime.now().minusDays(7))
                    .build(),
                ForumPost.builder()
                    .user(customer1)
                    .title("Oil change frequency for Yamaha R3")
                    .content("How often should I change the oil on my 2024 Yamaha R3?")
                    .category("maintenance")
                    .isHot(false)
                    .isHidden(false)
                    .likesCount(3)
                    .commentsCount(2)
                    .createAt(LocalDateTime.now().minusDays(5))
                    .build(),
                ForumPost.builder()
                    .user(admin)
                    .title("Welcome to the forum!")
                    .content("This is the official forum for motorcycle enthusiasts. Please read the rules before posting.")
                    .category("general")
                    .isHot(true)
                    .isHidden(false)
                    .likesCount(10)
                    .commentsCount(5)
                    .createAt(LocalDateTime.now().minusDays(10))
                    .build(),
                ForumPost.builder()
                    .user(customer)
                    .title("For Sale: CBR150R 2022 ODO 15k km - First Owner")
                    .content("Fully stock motorcycle, regularly serviced at the authorized dealer. Added a few basic accessories like crash bars and a windshield. Desired price: 60 million VND (negotiable). Contact: 09xx.xxx.xxx")
                    .category("usedbikes")
                    .price(60_000_000.0)
                    .isVerifiedByShop(true)
                    .isHot(true)
                    .isHidden(false)
                    .likesCount(12)
                    .commentsCount(8)
                    .createAt(LocalDateTime.now().minusDays(2))
                    .build(),
                ForumPost.builder()
                    .user(customer1)
                    .title("Sharing experience upgrading to Akrapovic exhaust for Kawasaki Z900")
                    .content("Hey everyone, today I just installed an Akrapovic Carbon exhaust on my Z900. First impression is a deep, warm sound that is smooth at low RPMs and screams excitingly when pulling the throttle. I remapped the ECU so there is no power lag.")
                    .category("customization")
                    .isHot(true)
                    .isHidden(false)
                    .likesCount(25)
                    .commentsCount(15)
                    .createAt(LocalDateTime.now().minusDays(1))
                    .build(),
                ForumPost.builder()
                    .user(customer)
                    .title("Looking to buy a used rear wheel rim for Ninja 400")
                    .content("Does anyone have a spare black rear rim for a Z400/Ninja 400? My bike hit a pothole and bent the rim. Please let me know your price.")
                    .category("parts")
                    .price(2_500_000.0)
                    .isVerifiedByShop(false)
                    .isHot(false)
                    .isHidden(false)
                    .likesCount(2)
                    .commentsCount(4)
                    .createAt(LocalDateTime.now().minusHours(5))
                    .build()
            );
            forumPostRepository.saveAll(forumPosts);
            log.info("Seeded {} forum posts", forumPosts.size());
        } else {
            forumPosts = forumPostRepository
                .findByIsHiddenFalse(
                    org.springframework.data.domain.PageRequest.of(
                        0,
                        10,
                        org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createAt")
                    )
                )
                .getContent();
        }
        createSampleForumComments(forumPosts, customer, customer1, admin);
    }

    private void createSampleForumComments(List<ForumPost> forumPosts, User customer, User customer1, User admin) {
        if (forumCommentRepository.count() > 0) return;

        log.info("Seeding forum comments...");

        List<ForumComment> forumComments = new java.util.ArrayList<>();

        forumComments.add(ForumComment.builder()
            .post(forumPosts.get(0))
            .user(customer1)
            .content("I recommend the Yamaha R3. It's a great entry-level sportbike.")
            .isHidden(false)
            .createAt(LocalDateTime.now().minusDays(6))
            .build());
        forumComments.add(ForumComment.builder()
            .post(forumPosts.get(0))
            .user(admin)
            .content("The Kawasaki Ninja 400 is also a good option.")
            .isHidden(false)
            .createAt(LocalDateTime.now().minusDays(5))
            .build());
        forumComments.add(ForumComment.builder()
            .post(forumPosts.get(0))
            .user(customer)
            .content("Thanks for the recommendations!")
            .isHidden(false)
            .createAt(LocalDateTime.now().minusDays(4))
            .build());

        forumComments.add(ForumComment.builder()
            .post(forumPosts.get(1))
            .user(admin)
            .content("You should change the oil every 5,000 km or 6 months, whichever comes first.")
            .isHidden(false)
            .createAt(LocalDateTime.now().minusDays(4))
            .build());
        forumComments.add(ForumComment.builder()
            .post(forumPosts.get(1))
            .user(customer)
            .content("Thanks for the information!")
            .isHidden(false)
            .createAt(LocalDateTime.now().minusDays(3))
            .build());

        forumComments.add(ForumComment.builder()
            .post(forumPosts.get(2))
            .user(customer)
            .content("Thanks for creating this forum!")
            .isHidden(false)
            .createAt(LocalDateTime.now().minusDays(9))
            .build());
        forumComments.add(ForumComment.builder()
            .post(forumPosts.get(2))
            .user(customer1)
            .content("Looking forward to discussing motorcycles here!")
            .isHidden(false)
            .createAt(LocalDateTime.now().minusDays(8))
            .build());

        forumCommentRepository.saveAll(forumComments);
        log.info("Seeded {} forum comments", forumComments.size());

        for (ForumPost post : forumPosts) {
            int commentCount = forumCommentRepository
                .findByPostIdAndIsHiddenFalseOrderByCreateAtDesc(post.getId())
                .size();
            post.setCommentsCount(commentCount);
            forumPostRepository.save(post);
        }
    }
}
