package com.logistics.shippingservice.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "t_shipments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Data
public class Shipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String trackingId;      // The unique UUID for the customer
    private String status;          // "PENDING", "DISPATCHED", "DELIVERED"
    private Long vehicleId;         // The ID of the truck assigned
    private String origin;          // Departure city
    private String destination;     // Arrival city
    private Double weight;

    // In Logistics, quantity is usually 1 (one shipment = one process)
    // but you can keep it if you are shipping "number of packages"
    private Integer packageCount;
}