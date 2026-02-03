package com.logistics.functionservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ShipmentInfo {
    private String trackingId;
    private String origin;
    private String destination;
    private double weight;
    private String licensePlate;
}