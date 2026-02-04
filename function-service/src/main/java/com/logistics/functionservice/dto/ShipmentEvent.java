package com.logistics.functionservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ShipmentEvent {
    private String trackingId;
    private String status;
    private String message;
    private Long vehicleId;
    private Double weight;

    // --- ADDED FIELDS ---
    // These are critical for the PDF Waybill!
    private String origin;
    private String destination;
    private String licensePlate;
}