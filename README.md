Logistics Management System - Documentation
## 1. System Overview
   The Logistics Management System is a distributed, cloud-native application designed to manage shipments, track vehicle fleets, and analyze route popularity in real-time. It employs an Event-Driven Microservices Architecture to decouple operations, ensuring high availability and scalability.

Key Features:

Micro-Frontend UI: A Shell application dynamically loads the Shipping/Fleet module.

Event Streaming: Kafka is used for high-volume analytics ingestion (Route Popularity).

Message Brokering: RabbitMQ handles asynchronous fleet status updates and document generation.

FaaS Integration: A serverless-style function generates Waybill PDFs on demand.

## 2. C4 Model: System Context
   This diagram illustrates the high-level interactions between the Logistics Manager (User) and the System.

```mermaid
C4Context
    title System Context Diagram - Logistics Platform

    Person(manager, "Logistics Manager", "A user managing shipments, fleets, and viewing analytics.")
    System(logistics_sys, "Logistics System", "Handles shipment dispatching, vehicle tracking, and real-time analytics.")
    System_Ext(keycloak, "Keycloak", "Identity Provider (OIDC). Handles authentication and token issuance.")

    Rel(manager, logistics_sys, "Dispatches Shipments / Views Dashboard", "HTTPS / WebSocket")
    Rel(logistics_sys, keycloak, "Validates JWT Tokens", "OIDC/OAuth2")

    UpdateLayoutConfig($c4ShapeInRow="3")
```

## 3. C4 Model: Container Diagram
This diagram details the internal components, showing how the Micro-Frontends communicate with the Backend Services via the API Gateway.
```mermaid
C4Container
    title Container Diagram - Logistics Microservices Architecture

    Person(user, "User", "Web Browser")

    Container_Boundary(frontend, "Micro-Frontend Layer") {
        Container(shell, "Shell (Host)", "Angular", "Main layout, Authentication, Global Dashboard.")
        Container(shop, "Logistics Remote", "Angular", "Shipment forms and Fleet management. Loaded via Module Federation.")
    }

    Container_Boundary(gateway_layer, "Edge Layer") {
        Container(gateway, "API Gateway", "Spring Cloud Gateway", "Routing, Load Balancing, Security.")
        ContainerDb(discovery, "Eureka Server", "Service Registry", "Service Discovery.")
    }

    Container_Boundary(services, "Microservices Layer") {
        Container(shipping, "Shipping Service", "Spring Boot", "Core logic. Persists shipments, triggers dispatch events.")
        Container(fleet, "Fleet Service", "Spring Boot", "Manages vehicles and driver availability.")
        Container(analytics, "Analytics Service", "Spring Boot", "Consumes route data from Kafka to calculate city popularity.")
        Container(faas, "Function Service", "Spring Cloud Function", "Stateless Consumer. Generates PDF Waybills from RabbitMQ events.")
    }

    Container_Boundary(infra, "Infrastructure Layer") {
        ContainerDb(db, "PostgreSQL", "SQL Database", "Stores Shipments and Vehicle data.")
        ContainerDb(redis, "Redis", "In-Memory Cache", "Rate Limiting counters for API Gateway.")
        ContainerDb(broker, "RabbitMQ", "Message Broker", "Async communication (Fleet updates, PDF generation).")
        ContainerDb(kafka, "Kafka", "Event Streaming", "High-throughput Analytics ingestion.")
    }

    Rel(user, shell, "Loads App", "HTTPS")
    Rel(shell, shop, "Lazily Loads", "Module Federation")
    Rel(shell, gateway, "API Calls", "HTTPS / JSON")
    Rel(shell, gateway, "Live Updates", "WebSocket (STOMP)")

    Rel(gateway, discovery, "Service Lookup", "Eureka API")
    Rel(gateway, redis, "Checks Rate Limit", "RESP")
    Rel(gateway, shipping, "Routes /api/shipments", "Load Balanced HTTP")
    Rel(gateway, fleet, "Routes /api/vehicles", "Load Balanced HTTP")
    Rel(gateway, analytics, "Routes /api/analytics", "Load Balanced HTTP")

    Rel(shipping, db, "Persists Data", "JDBC")
    Rel(fleet, db, "Persists Data", "JDBC")
    
    Rel(shipping, broker, "Publishes Dispatch Event", "AMQP")
    Rel(fleet, broker, "Consumes (Update Vehicle Status)", "AMQP")
    Rel(faas, broker, "Consumes (Generate PDF)", "AMQP")
    
    Rel(shipping, kafka, "Streams Route Data", "TCP (Producer)")
    Rel(analytics, kafka, "Consumes Route Data", "TCP (Consumer)")

    UpdateLayoutConfig($c4ShapeInRow="4", $c4BoundaryInRow="1")
```

## 4. UML Sequence Diagram: The "Dispatch Shipment" Flow
This diagram demonstrates the flow we just debugged: Synchronous storage combined with Asynchronous messaging (RabbitMQ & Kafka).

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Shell as UI Shell
    participant Gateway as API Gateway
    participant ShipService as Shipping Service
    participant DB as PostgreSQL
    participant Rabbit as RabbitMQ
    participant Kafka as Kafka
    participant Fleet as Fleet Service
    participant FaaS as Function Service
    participant Analytics as Analytics Service
    

    Note over User, Gateway: User clicks "Dispatch" in the UI

    User->>Shell: Dispatch(VehicleID, Origin, Dest)
    Shell->>Gateway: POST /api/shipments/dispatch
    Gateway->>ShipService: Proxy Request

    activate ShipService
    ShipService->>ShipService: Assign TrackingID
    ShipService->>DB: INSERT INTO t_shipments (Status: DISPATCHED)
    
    par RabbitMQ Flow (Operational)
        ShipService->>Rabbit: Publish (ShipmentEvent)
        
        Note right of Rabbit: Fan-out to multiple queues
        
        Rabbit->>FaaS: Consume Message
        activate FaaS
        FaaS->>FaaS: Generate PDF Waybill
        FaaS->>FaaS: Save /waybills/ticket.pdf
        deactivate FaaS
        
        Rabbit->>Fleet: Consume Message
        activate Fleet
        Fleet->>Fleet: Set Vehicle "Busy"
        Fleet->>DB: UPDATE t_vehicles
        deactivate Fleet
        
    and Kafka Flow (Analytics)
        ShipService->>Kafka: Publish (RouteEvent)
        Kafka->>Analytics: Consume Message
        activate Analytics
        Analytics->>Analytics: Update City Counter (+1)
        deactivate Analytics
    end

    ShipService--)Gateway: WebSocket Notification (Success)
    ShipService-->>Gateway: 200 OK (TrackingID)
    deactivate ShipService
    
    Gateway-->>Shell: 200 OK
    Gateway--)Shell: WS Push: "Shipment Dispatched"
    
    Note over User, Analytics: Dashboard updates in real-time
    
    Shell->>Gateway: GET /api/analytics/stats
    Gateway->>Analytics: Fetch Stats
    Analytics-->>Shell: {"Cluj-Napoca": 5, "Timisoara": 2}
    Shell->>User: Update Charts
```

## 5. Technology Stack Summary

| Component         | Technology            | Role                                                                           |
|-------------------|-----------------------|--------------------------------------------------------------------------------|
| Frontend Host     | Angular 17            | Shell application, Authentication, WebSocket client.                           |
| Frontend Remote   | Angular 17            | Logistics Module (Shipment Forms, Fleet List), exposed via Module Federation.  |
| Gateway           | Spring Cloud Gateway  | Entry point, Security (OAuth2 Resource Server), Client-Side Load Balancing.    |
| Discovery         | Netflix Eureka        | Dynamic service registration and discovery.                                    |
| Shipping Service  | Spring Boot           | Core domain logic. Produces messages to RabbitMQ and Kafka.                    |
| Fleet Service     | Spring Boot           | Manages vehicles. Consumes RabbitMQ events to update vehicle availability.     |
| FaaS              | Spring Cloud Function | RabbitMQ Consumer. Stateless function that generates PDF Waybills.             |
| Analytics Service | Spring Boot + Kafka   | Kafka Consumer. Aggregates route data for the dashboard.                       |
| Infrastructure    | Docker Compose        | Orchestration of Postgres, Redis, RabbitMQ, Kafka, Zookeeper, and Keycloak.    |
