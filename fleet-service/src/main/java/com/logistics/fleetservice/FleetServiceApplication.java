package com.logistics.fleetservice;

import com.logistics.fleetservice.repository.VehicleRepository;
import com.logistics.fleetservice.domain.Vehicle;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.context.annotation.Bean;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EnableDiscoveryClient
@EnableJpaRepositories(basePackages = "com.logistics.fleetservice.repository")
@EntityScan(basePackages = "com.logistics.fleetservice.domain")
public class FleetServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(FleetServiceApplication.class, args);
    }

    @Bean
    public CommandLineRunner loadData(VehicleRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                // Updated to save Vehicles (Plate Number, Model, Type, Capacity, Fuel/Status)
                repository.save(new Vehicle(null, "CJ-99-LOG", "Mercedes-Benz Sprinter", "VAN", 1500.0, 100, true));
                repository.save(new Vehicle(null, "B-102-TFL", "Volvo FH16", "HEAVY_TRUCK", 24000.0, 80, true));
                repository.save(new Vehicle(null, "CJ-22-DEL", "Ford Transit", "VAN", 2000.0, 95, true));
                repository.save(new Vehicle(null, "B-55-FAST", "Scania R500", "HEAVY_TRUCK", 18000.0, 100, true));
            }
        };
    }
}
