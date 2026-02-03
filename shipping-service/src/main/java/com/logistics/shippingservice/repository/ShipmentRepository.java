package com.logistics.shippingservice.repository;

import com.logistics.shippingservice.entity.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, Long> {
    // This empty interface gives you .save(), .findAll(), .findById() for free!
}