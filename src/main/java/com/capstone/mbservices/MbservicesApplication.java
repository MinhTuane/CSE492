package com.capstone.mbservices;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableCaching
@EnableScheduling
@EnableAsync
@ComponentScan(basePackages = "com.capstone.mbservices") 
public class MbservicesApplication {

    public static void main(String[] args) {
        SpringApplication.run(MbservicesApplication.class, args);
    }

}
