package com.capstone.mbservices.config;

import com.capstone.mbservices.entity.Store;
import com.capstone.mbservices.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class StoreDataSeeder implements CommandLineRunner {

    private final StoreRepository storeRepository;

    @Override
    public void run(String... args) throws Exception {
        seedStores();
    }

    private void seedStores() {
        // Store seeding is handled by DataSeeder.java (4 Binh Duong branches).
        // This seeder is disabled to avoid creating duplicate/incorrect store records.
        if (storeRepository.count() > 0) {
            log.info("Stores already seeded. Skipping...");
            return;
        }
        // Do not seed here - DataSeeder handles the canonical store list.
        log.info("StoreDataSeeder: skipped (DataSeeder manages store data).");

        log.info("Seeding initial store locations...");

        List<Store> stores = Arrays.asList(
            // Ho Chi Minh City
            Store.builder()
                .name("MBServices District 1 (HQ)")
                .address("123 Nguyen Trai, District 1, Ho Chi Minh City")
                .phone("0901234567")
                .latitude(10.7686)
                .longitude(106.6908)
                .brand("HONDA,YAMAHA,DUCATI")
                .licensed(true)
                .contractStart(LocalDate.now().minusYears(1))
                .contractEnd(LocalDate.now().plusYears(4))
                .build(),
                
            Store.builder()
                .name("MBServices District 7")
                .address("456 Nguyen Van Linh, District 7, Ho Chi Minh City")
                .phone("0902345678")
                .latitude(10.7303)
                .longitude(106.7082)
                .brand("HONDA,SUZUKI")
                .licensed(true)
                .contractStart(LocalDate.now().minusMonths(6))
                .contractEnd(LocalDate.now().plusYears(2))
                .build(),
                
            Store.builder()
                .name("MBServices Thu Duc")
                .address("789 Vo Van Ngan, Thu Duc City, Ho Chi Minh City")
                .phone("0903456789")
                .latitude(10.8499)
                .longitude(106.7649)
                .brand("YAMAHA,KAWASAKI")
                .licensed(true)
                .contractStart(LocalDate.now().minusMonths(2))
                .contractEnd(LocalDate.now().plusYears(3))
                .build(),

            // Hanoi
            Store.builder()
                .name("MBServices Cau Giay")
                .address("101 Xuan Thuy, Cau Giay District, Hanoi")
                .phone("0911234567")
                .latitude(21.0378)
                .longitude(105.7831)
                .brand("HONDA,YAMAHA,BMW")
                .licensed(true)
                .contractStart(LocalDate.now().minusYears(2))
                .contractEnd(LocalDate.now().plusYears(3))
                .build(),
                
            Store.builder()
                .name("MBServices Hoan Kiem")
                .address("202 Hai Ba Trung, Hoan Kiem District, Hanoi")
                .phone("0912345678")
                .latitude(21.0252)
                .longitude(105.8453)
                .brand("DUCATI,HARLEY")
                .licensed(true)
                .contractStart(LocalDate.now())
                .contractEnd(LocalDate.now().plusYears(5))
                .build(),

            // Da Nang
            Store.builder()
                .name("MBServices Hai Chau")
                .address("303 Le Duan, Hai Chau District, Da Nang")
                .phone("0921234567")
                .latitude(16.0718)
                .longitude(108.2201)
                .brand("HONDA,YAMAHA")
                .licensed(true)
                .contractStart(LocalDate.now().minusMonths(1))
                .contractEnd(LocalDate.now().plusYears(2))
                .build()
        );

        storeRepository.saveAll(stores);
        log.info("Successfully seeded {} stores.", stores.size());
    }
}
