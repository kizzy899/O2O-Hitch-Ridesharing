package com.o2o.hitch.passenger;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication(scanBasePackages = "com.o2o.hitch")
@EnableDiscoveryClient
public class PassengerServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(PassengerServiceApplication.class, args);
    }
}
