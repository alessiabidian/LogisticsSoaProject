package com.logistics.fleetservice.rabbitmq.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ShipmentEvent {
    private String status;
    private String message;
    private Long vehicleId;
    private int quantity;
}
