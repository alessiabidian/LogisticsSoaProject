package com.logistics.fleetservice.rabbitmq.consumer;

import com.logistics.fleetservice.rabbitmq.dto.ShipmentEvent;
import com.logistics.fleetservice.repository.VehicleRepository;
import com.logistics.fleetservice.domain.Vehicle;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FleetConsumer {

    private static final Logger LOGGER = LoggerFactory.getLogger(FleetConsumer.class);
    private final VehicleRepository vehicleRepository;

    @RabbitListener(queues = "shipment_dispatch_queue")//"shipment_queue")
    @Transactional
    public void consume(ShipmentEvent event) {

        LOGGER.info("Received shipment event -> {}", event);

        Vehicle vehicle = vehicleRepository.findById(event.getVehicleId()).orElse(null);

        if (vehicle != null) {
            if (vehicle.isAvailable()) {
                vehicle.setAvailable(false);
                vehicleRepository.save(vehicle);

                LOGGER.info("Vehicle {} is now IN_TRANSIT.", vehicle.getLicensePlate());
            } else {
                LOGGER.warn("Vehicle ID: {} is already occupied!", event.getVehicleId());
            }
        } else {
            LOGGER.error("Vehicle with ID {} not found in database!", event.getVehicleId());
        }
    }
}
