package com.logistics.functionservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class FunctionServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(FunctionServiceApplication.class, args);
    }
}
