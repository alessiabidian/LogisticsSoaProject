# Tutorial: Building Resilient Microservices with Event-Driven Architecture and FaaS
Project: Logistics Management System Repository - Author: Alessia Bidian

## 1. Introduction
In modern distributed systems, synchronous communication (like REST) often leads to tight coupling and performance bottlenecks. A classic example in logistics is document generation: when a user dispatches a shipment, they expect immediate confirmation. If the system forces the user to wait while a server generates a complex PDF waybill, the user experience suffers, and the system becomes fragile.

This tutorial demonstrates how to implement a "Fire-and-Forget" asynchronous pattern using RabbitMQ (Message Broker) and Spring Cloud Function (FaaS). We will build a system where the Shipping Service handles the transaction and immediately offloads the heavy lifting (PDF generation) to a separate, stateless Function Service.

This approach aligns with the Reactive Manifesto principles, specifically regarding Responsiveness (the system responds in a timely manner) and Message Driven (asynchronous message-passing ensures loose coupling).

## 2. Architecture Overview
   The system architecture relies on the Producer-Consumer pattern, decoupled by an exchange and consists of three main components:

### 2.1 The Components
Shipping Service (Producer): The transactional heart of the system. It receives the HTTP request from the Angular frontend, persists the shipment state to PostgreSQL, and publishes a ShipmentEvent to the message broker.

RabbitMQ (Message Broker): The middleware that guarantees message delivery. It acts as a buffer, ensuring that even if the document generator is down, the request is not lost. We utilize a Topic Exchange to allow for future scalability (e.g., adding an Email Service that listens to the same event).

Function Service (Consumer): A specialized, stateless microservice. It implements the "Function-as-a-Service" pattern using Spring Cloud Function. It listens to the broker, generates the PDF using the OpenPDF library, and stores it on the file system.

### 2.2 Data Flow
User clicks "Dispatch" in the UI.

Shipping Service saves status DISPATCHED to the database.

Shipping Service emits event dispatch.created to RabbitMQ.

User receives "Success" response (200 OK) immediately (latency < 100ms).

Asynchronously, Function Service wakes up, consumes the event, and renders the PDF.

## 3. Step 1: Infrastructure Setup (Docker)
To ensure reproducibility, we define our infrastructure as code using Docker Compose. This allows all services to communicate on a private bridge network logistics-network.
```yaml
rabbitmq:
  image: rabbitmq:3.12-management
  ports:
    - "5672:5672"   # AMQP Protocol (for Services)
    - "15672:15672" # Management Dashboard (for Developers)
  environment:
    RABBITMQ_DEFAULT_USER: guest
    RABBITMQ_DEFAULT_PASS: guest
  networks:
    - logistics-network
```

Note: Port 5672 is the standard AMQP port for application communication, while 15672 provides a GUI for monitoring queue depth and consumer rates.

### 4. Step 2: The Producer Implementation (Shipping Service)
The Shipping Service is responsible for the business transaction. We must ensure that the event sent to the broker contains all necessary context (Tracking ID, Origin, Destination, License Plate) so the consumer does not need to call back to the database (avoiding the "N+1 Service Call" anti-pattern).

### 4.1 RabbitMQ Configuration
We define a Topic Exchange. Unlike a Direct Exchange, a Topic Exchange allows routing based on wildcards (e.g., shipment.*), providing better flexibility for future consumers.

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

### 4.2 The Transactional Controller
The controller handles the HTTP request. A key design decision here was to ensure the licensePlate is persisted to the database to ensure data consistency between the UI history and the generated PDF.

```java
@RestController
@RequestMapping("/api/shipments")
@RequiredArgsConstructor
@Slf4j
public class ShipmentController {

    private final ShipmentRepository shipmentRepository;
    private final ShipmentProducer shipmentProducer;

    @PostMapping("/dispatch")
    public String dispatchShipment(@RequestBody Shipment shipment) {
        // 1. Enrich Data
        shipment.setTrackingId(UUID.randomUUID().toString());
        shipment.setStatus("DISPATCHED");

        // 2. Persist State (Synchronous)
        shipmentRepository.save(shipment);

        // 3. Create Event Payload (DTO)
        ShipmentEvent event = new ShipmentEvent();
        event.setTrackingId(shipment.getTrackingId());
        event.setStatus("IN_TRANSIT");
        event.setOrigin(shipment.getOrigin());
        event.setDestination(shipment.getDestination());
        event.setLicensePlate(shipment.getLicensePlate());

        // 4. Publish Event (Asynchronous)
        shipmentProducer.sendMessage(event);

        return "Shipment Dispatched! Tracking ID: " + shipment.getTrackingId();
    }
}
```

## 5. Step 3: The Consumer Implementation (FaaS)
The Function Service utilizes Spring Cloud Function. This framework allows us to write business logic as standard Java java.util.function interfaces (Consumer, Function, Supplier), abstracting away the boilerplate code usually required to connect to message brokers.

### 5.1 The Business Logic
The logic is encapsulated in a simple Bean. This makes unit testing incredibly easy, as we can test the function without spinning up a RabbitMQ instance.

```java
@Configuration
@Slf4j
public class WaybillFunction {

    @Bean
    public Consumer<ShipmentEvent> generateWaybill() {
        return event -> {
            log.info("Event Received: Generating PDF for {}", event.getTrackingId());
            try {
                createPdf(event);
            } catch (Exception e) {
                log.error("Failed to generate PDF", e);
            }
        };
    }

    private void createPdf(ShipmentEvent event) {
        Document document = new Document();
        PdfWriter.getInstance(document, new FileOutputStream("waybills/" + event.getTrackingId() + ".pdf"));
        document.open();

        // Header
        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 24);
        document.add(new Paragraph("OFFICIAL WAYBILL", titleFont));

        // Content
        document.add(new Paragraph("Tracking ID: " + event.getTrackingId()));
        document.add(new Paragraph("Vehicle Plate: " + event.getLicensePlate()));
        document.add(new Paragraph("Route: " + event.getOrigin() + " -> " + event.getDestination()));

        document.close();
    }
}
```

### 5.2 The Binding Configuration (application.yml)
This configuration binds the abstract Java function (generateWaybill) to the concrete infrastructure channel (shipment_exchange).

```yaml
spring:
  cloud:
    function:
      definition: generateWaybill
    stream:
      bindings:
        # Input Binding: <functionName>-in-<index>
        generateWaybill-in-0:
          destination: shipment_exchange # The Exchange to listen to
          group: pdf-generators          # Consumer Group (enables load balancing)
          consumer:
            max-attempts: 3              # Resilience: Retry 3 times on failure
```


## 6. Challenges & Solutions

### 6.1 Data Consistency vs. Transience
Challenge: Initially, the licensePlate field was considered transient data (not part of the database schema). This posed a risk: if the message broker failed to receive the message immediately, the license plate data would be lost forever, as it wasn't saved in the database.

Solution: I refactored the data model to persist the licensePlate column in the database. This ensures ACID properties (Atomicity, Consistency, Isolation, Durability) are maintained. If the system crashes after saving but before sending the event, the data remains safe in the database and can be reconciled later.

### 6.2 Service Coupling
#### Challenge:
Ensure the Function Service doesn't crash if the Shipping Service changes its internal data structures.

#### Solution:
We introduced a shared Data Transfer Object (DTO) ShipmentEvent. By using a DTO instead of the raw Entity, we follow the Bounded Context pattern from Domain-Driven Design (DDD), ensuring the internal mechanics of the Shipping Service don't leak into the Function Service.

## 7. Conclusion
By implementing an Event-Driven Architecture, we achieved significant improvements in system Resilience and Scalability:

1. Fault Tolerance: If the PDF Generator service crashes, messages simply pile up in the RabbitMQ queue. Once the service restarts, it processes the backlog with zero data loss.

2. Scalability: We can scale the Function Service independently. If PDF generation becomes slow, we can spin up 5 more instances of the Function container without touching the Shipping Service.

This architecture successfully demonstrates the decoupling power of Message Brokers in modern application development.

## 8. References & Resources

* [Spring Cloud Data Flow Team. (2023). Spring Cloud Function Reference Documentation.](https://spring.io/projects/spring-cloud-function)
* [RabbitMq Documentation (2024). Tutorial 5: Topics. VMware](https://www.rabbitmq.com/tutorials/tutorial-five-java.html)
* [The Reactive Manifesto. (2014). Principles of Reactive Programming](https://www.reactivemanifesto.org/)