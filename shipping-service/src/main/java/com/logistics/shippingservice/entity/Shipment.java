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
    private Long vehicleId;
    private String origin;
    private String destination;
    private Double weight;
    //@Transient
    private String licensePlate;

    private Integer packageCount;
}