package com.logistics.shippingservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ShipmentEvent {
    private String status; // PENDING, COMPLETED
    private String message;
    private Long vehicleId;     // Formerly itemId
    private String trackingId;  // The UUID generated in the Controller
    private Double weight;      // Logistics-specific data
}
