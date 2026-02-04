package com.logistics.shippingservice.controller;

import com.logistics.shippingservice.entity.Shipment;
import com.logistics.shippingservice.kafka.AnalyticsProducer;
import com.logistics.shippingservice.repository.ShipmentRepository; // Import the new file
import com.logistics.shippingservice.rabbitmq.producer.ShipmentProducer;
import com.logistics.shippingservice.dto.ShipmentEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/shipments")
@RequiredArgsConstructor
public class ShipmentController {

    private final ShipmentProducer shipmentProducer;
    private final SimpMessagingTemplate messagingTemplate;
    private final ShipmentRepository shipmentRepository;

    private final AnalyticsProducer analyticsProducer;

    @GetMapping
    public List<Shipment> getAllShipments() {
        return shipmentRepository.findAll();
    }

    @GetMapping("/label/{trackingId}")
    public ResponseEntity<byte[]> getLabel(@PathVariable String trackingId) {
        // 1. Find the Shipment (In a real app, use the repository)

        // 2. Generate a simple HTML Label
        String labelContent = "<html><body>" +
                "<div style='border: 2px solid black; padding: 20px; width: 300px; font-family: monospace;'>" +
                "<h1 style='text-align: center;'>LOGISTICS APP</h1>" +
                "<hr/>" +
                "<h3>TRACKING: " + trackingId + "</h3>" +
                "<p><strong>PRIORITY SHIPMENT</strong></p>" +
                "<p>From: Warehouse A<br/>To: Customer Location</p>" +
                "<div style='text-align: center; margin-top: 20px;'>" +
                "<div style='background: black; height: 50px; width: 80%; margin: 0 auto;'></div>" +
                "<p>" + trackingId + "</p>" +
                "</div>" +
                "</div>" +
                "</body></html>";

        byte[] content = labelContent.getBytes();

        // 3. Return as a downloadable file
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"label-" + trackingId + ".html\"")
                .contentType(MediaType.TEXT_HTML)
                .body(content);
    }

    // 2. POST Endpoint (Dispatches and Saves)
    @PostMapping("/dispatch")
    public String dispatchShipment(@RequestBody Shipment shipment) {
        // Set internal logic fields
        shipment.setTrackingId(UUID.randomUUID().toString());
        shipment.setStatus("DISPATCHED");

        // SAVE TO DB
        shipmentRepository.save(shipment);

        // Notify Fleet Service via RabbitMQ
        ShipmentEvent event = new ShipmentEvent();
        event.setStatus("IN_TRANSIT");
        event.setMessage("Shipment dispatched via " + shipment.getOrigin());
        event.setVehicleId(shipment.getVehicleId());
        event.setWeight(shipment.getWeight());
        // -----------------------
        event.setTrackingId(shipment.getTrackingId());
        event.setOrigin(shipment.getOrigin());
        event.setDestination(shipment.getDestination());
        String plate = shipment.getLicensePlate() != null ? shipment.getLicensePlate() : "ID-" + shipment.getVehicleId();
        event.setLicensePlate(plate);
        // -----------------------
        shipmentProducer.sendMessage(event);

        // Notify Dashboard via WebSocket
        String notification = "{\"status\":\"DISPATCHED\", \"trackingId\":\"" + shipment.getTrackingId() + "\"}";
        messagingTemplate.convertAndSend("/topic/shipments", notification);

        // 5. Notify Analytics (Kafka)
        try {
            analyticsProducer.sendRouteStats(shipment.getOrigin(), shipment.getDestination());
        } catch (Exception e) {
            // Log error but don't fail the shipment if analytics is down
            System.err.println("Analytics Error: " + e.getMessage());
        }

        return "Shipment Dispatched Successfully! Tracking ID: " + shipment.getTrackingId();
    }
}