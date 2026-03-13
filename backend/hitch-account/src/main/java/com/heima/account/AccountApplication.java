package com.heima.account;

import com.heima.commons.initial.annotation.EnableRequestInital;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.ImportResource;

@SpringBootApplication
@EnableDiscoveryClient
//开启fegin支持，clients是指哪个类开启fegin
@EnableFeignClients(basePackages = {"com.heima.account.service"})
@EnableRequestInital
@ImportResource("classpath:applicationContext.xml")
public class AccountApplication {
    public static void main(String[] args) {
        SpringApplication.run(AccountApplication.class, args);

    }
}
