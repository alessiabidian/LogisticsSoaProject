# How to Build Micro-Frontends with Angular and Webpack Module Federation

## Tutorial: Event-Driven PDF Generation with Spring Cloud Function & RabbitMQ
Project: Logistics Management System Repository - Author: Alessia Bidian

## 1. Introduction
   In modern microservices architectures, long-running tasks (like generating PDF documents, sending emails, or image processing) should never block the main user flow. If a user clicks "Dispatch Shipment", they expect an immediate confirmation, not a spinning loading icon while the server draws a PDF.

This tutorial demonstrates how to implement a Fire-and-Forget pattern using RabbitMQ and Spring Cloud Function. A system will be built where the Shipping Service dispatches an order, and a separate Function Service (FaaS) generates a Waybill PDF asynchronously.

## 2. Architecture Overview
   The system consists of three main components:

->Shipping Service (Producer): Receives the user request, saves the shipment to the DB, and publishes a ShipmentEvent to the message broker.

->RabbitMQ (Broker): Acts as the buffer, holding the message until it can be processed.

->Function Service (Consumer): A stateless microservice that listens to the broker, generates the PDF, and saves it to storage.

## 3. Step 1: Infrastructure (Docker)
   We use Docker Compose to spin up RabbitMQ to ensure that our message broker is available to all services on the logistics-network.
```yaml
rabbitmq:
    image: rabbitmq:3.12-management
    ports:
      - "5672:5672"   # AMQP Protocol
      - "15672:15672" # Management Dashboard
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest
```

### 4. Step 2: The Producer (Shipping Service)
The Shipping Service needs to decouple the logic. Instead of calling a PDF generator directly, it sends a message.

In the Configuration class (RabbitMqConfig.java) we define a Topic Exchange. This allows multiple services (Fleet, Analytics, FaaS) to listen to the same event if needed.

```java
@Configuration
public class RabbitMqConfig {
    public static final String EXCHANGE = "shipment_exchange";
    public static final String ROUTING_KEY = "dispatch.created";

    @Bean
    public TopicExchange exchange() {
        return new TopicExchange(EXCHANGE);
    }

    // JSON conversion
    @Bean
    public MessageConverter converter() {
        return new Jackson2JsonMessageConverter();
    }
}
```

Publishing the Event
In the Controller, we capture the data (including transient fields like licensePlate) and fire the event.

```java
package com.logistics.shippingservice.controller;

import com.logistics.shippingservice.dto.ShipmentEvent;
import com.logistics.shippingservice.entity.Shipment;
import com.logistics.shippingservice.kafka.AnalyticsProducer;
import com.logistics.shippingservice.rabbitmq.config.RabbitMqConfig;
import com.logistics.shippingservice.rabbitmq.producer.ShipmentProducer;
import com.logistics.shippingservice.repository.ShipmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
@Slf4j
public class ShipmentController {

    private final ShipmentRepository shipmentRepository;
    private final ShipmentProducer shipmentProducer;
    private final AnalyticsProducer analyticsProducer;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * GET Endpoint: Lists all shipments for the dashboard history.
     */
    @GetMapping
    public List<Shipment> getAllShipments() {
        return shipmentRepository.findAll();
    }

    /**
     * POST Endpoint: Dispatches a shipment.
     * Triggers: Database Save, RabbitMQ (Fleet + PDF), Kafka (Analytics), WebSocket (UI)
     */
    @PostMapping("/dispatch")
    public String dispatchShipment(@RequestBody Shipment shipment) {
        log.info("Received dispatch request for vehicle: {}", shipment.getVehicleId());

        // ---------------------------------------------------------------
        // 1. CAPTURE TRANSIENT DATA
        // We must save the license plate string NOW, because it is marked
        // as @Transient. After repository.save(), Hibernate might reset it.
        // ---------------------------------------------------------------
        String plateFromFrontend = shipment.getLicensePlate();

        // Generate System Data
        shipment.setTrackingId(UUID.randomUUID().toString());
        shipment.setStatus("DISPATCHED");

        // 2. SAVE TO DATABASE (Synchronous)
        shipmentRepository.save(shipment);
        log.info("Shipment saved to DB with ID: {}", shipment.getId());

        // 3. PREPARE EVENT (For RabbitMQ)
        ShipmentEvent event = new ShipmentEvent();
        event.setStatus("IN_TRANSIT");
        event.setMessage("Shipment dispatched via " + shipment.getOrigin());
        event.setVehicleId(shipment.getVehicleId());
        event.setWeight(shipment.getWeight());
        event.setTrackingId(shipment.getTrackingId());
        event.setOrigin(shipment.getOrigin());
        event.setDestination(shipment.getDestination());

        // Assign the captured plate (handle nulls safely)
        if (plateFromFrontend != null && !plateFromFrontend.isEmpty()) {
            event.setLicensePlate(plateFromFrontend);
        } else {
            event.setLicensePlate("ID-" + shipment.getVehicleId());
        }

        // 4. SEND TO RABBITMQ (Asynchronous)
        // Triggers the Fleet Service (Update Status) and FaaS (Generate PDF)
        shipmentProducer.sendMessage(event);

        // 5. SEND TO KAFKA (Asynchronous - Fire & Forget)
        // Triggers the Analytics Service
        try {
            analyticsProducer.sendRouteStats(shipment.getOrigin(), shipment.getDestination());
        } catch (Exception e) {
            log.error("Failed to send analytics to Kafka (Non-blocking error)", e);
        }

        // 6. NOTIFY UI (WebSocket)
        // Pushes a popup notification to the dashboard
        String notification = String.format("{\"status\":\"DISPATCHED\", \"trackingId\":\"%s\"}", shipment.getTrackingId());
        messagingTemplate.convertAndSend("/topic/shipments", notification);

        return "Shipment Dispatched Successfully! Tracking ID: " + shipment.getTrackingId();
    }

    /**
     * Endpoint to download a basic label (Direct Backend version)
     * Note: The PDF version is handled by the FaaS service, not this one.
     */
    @GetMapping("/label/{trackingId}")
    public ResponseEntity<byte[]> getLabel(@PathVariable String trackingId) {
        String labelContent = "LOGISTICS LABEL\n----------------\nTRACKING: " + trackingId;
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"label-" + trackingId + ".txt\"")
                .contentType(MediaType.TEXT_PLAIN)
                .body(labelContent.getBytes());
    }
}
```

### 5. Step 3: The Consumer (Function Service)
We use Spring Cloud Function, which abstracts away the complexity of messaging. We have to define a Java Consumer bean, and the framework handles the connection to RabbitMQ.

The Business Logic class (WaybillFunction.java):
This class contains the PDF generation logic using the iText or OpenPDF library.

```java
@Configuration
@Slf4j
public class WaybillFunction {

    @Bean
    public Consumer<ShipmentEvent> generateWaybill() {
        return event -> {
            log.info("Received Event: Generating PDF for {}", event.getTrackingId());
            createPdf(event);
        };
    }

    private void createPdf(ShipmentEvent event) {
        // PDF Generation Logic (iText/OpenPDF)
        Document document = new Document();
        PdfWriter.getInstance(document, new FileOutputStream("waybills/" + event.getTrackingId() + ".pdf"));
        document.open();
        document.add(new Paragraph("WAYBILL: " + event.getTrackingId()));
        document.add(new Paragraph("Vehicle: " + event.getLicensePlate()));
        document.close();
    }
}
```

The Binding Configuration (application.yml)
This is the "magic" bridge that links everything together. We tell Spring Cloud Stream to map the generateWaybill function to the shipment_exchange.

```yaml
spring:
  cloud:
    function:
      definition: generateWaybill
    stream:
      bindings:
        # Syntax: <functionName>-in-<index>
        generateWaybill-in-0:
          destination: shipment_exchange # Must match Producer Exchange
          group: pdf-generators          # Consumer Group (for scaling)
```

## 6. Challenges & Solutions
During implementation, I encountered a Transient Data Issue.

Problem: The licensePlate field was not stored in the database (marked as @Transient), so when Hibernate saved the shipment, the field was lost before the event was created.

Solution: Capture the licensePlate string from the incoming JSON before saving the entity to the database. Then, manually injected this value into the RabbitMQ ShipmentEvent.

## 7. Conclusion
   By using this architecture, the Shipping Service remains fast and responsive. Even if the PDF generation takes 5 seconds (or if the FaaS service crashes), the user gets an instant response. RabbitMQ ensures the message is safe and the PDF will be generated eventually, providing a resilient and scalable user experience.

## 8. References & Resources

* [Spring Cloud Function](https://spring.io/projects/spring-cloud-function)
* [RabbitMq](https://www.rabbitmq.com/#:~:text=you%20name%20it.-,Reliable,messages%20are%20safe%20with%20RabbitMQ.)
