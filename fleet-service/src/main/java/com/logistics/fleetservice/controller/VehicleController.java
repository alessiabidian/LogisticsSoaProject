package com.logistics.fleetservice.controller;

import com.logistics.fleetservice.repository.VehicleRepository;
import com.logistics.fleetservice.domain.Vehicle;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleRepository vehicleRepository;

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public List<Vehicle> getAllItems() {
        return vehicleRepository.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Vehicle createItem(@RequestBody Vehicle vehicle) {
        return vehicleRepository.save(vehicle);
    }

    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public Vehicle getItem(@PathVariable Long id) {
        return vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));
    }
}
