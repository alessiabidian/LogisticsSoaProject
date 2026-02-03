package com.logistics.fleetservice.repository;

import com.logistics.fleetservice.domain.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {}
