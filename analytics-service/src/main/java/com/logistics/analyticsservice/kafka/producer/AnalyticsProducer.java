/*package com.logistics.analyticsservice.kafka.producer;

import com.logistics.analyticsservice.model.RouteEvent;
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

    public void sendRouteData(RouteEvent event) {
        LOGGER.info(String.format("Producing Route Event -> %s to %s", event.getOrigin(), event.getDestination()));

        Message<RouteEvent> message = MessageBuilder
                .withPayload(event)
                .setHeader(KafkaHeaders.TOPIC, "logistics_routes")
                .build();

        kafkaTemplate.send(message);
    }
}*/