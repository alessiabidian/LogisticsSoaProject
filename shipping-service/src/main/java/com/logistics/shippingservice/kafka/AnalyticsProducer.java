package com.logistics.shippingservice.kafka;

import com.logistics.shippingservice.dto.RouteEvent;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.Message;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AnalyticsProducer {

    private static final Logger LOGGER = LoggerFactory.getLogger(AnalyticsProducer.class);
    private final KafkaTemplate<String, RouteEvent> kafkaTemplate;

    public void sendRouteStats(String origin, String destination) {
        // Create the event
        RouteEvent event = new RouteEvent(origin, destination, System.currentTimeMillis());

        LOGGER.info("Sending Route Analytics to Kafka: {} -> {}", origin, destination);

        Message<RouteEvent> message = MessageBuilder
                .withPayload(event)
                .setHeader(KafkaHeaders.TOPIC, "logistics_routes")
                .build();

        // Send asynchronously
        kafkaTemplate.send(message);
    }
}