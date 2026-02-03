package com.logistics.analyticsservice.kafka.consumer;

import com.logistics.analyticsservice.model.RouteEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AnalyticsConsumer {

    private static final Logger LOGGER = LoggerFactory.getLogger(AnalyticsConsumer.class);

    // Stores "City Name" -> "Number of Shipments Involved"
    private final Map<String, Integer> cityPopularityIndex = new ConcurrentHashMap<>();

    @KafkaListener(topics = "logistics_routes", groupId = "analytics_group")
    public void consume(RouteEvent event) {
        // We only care about the Destination city for "Dispatches to city"
        // If you want to count both, keep both merges.
        cityPopularityIndex.merge(event.getDestination(), 1, Integer::sum);

        LOGGER.info("New dispatch to {}. Total for city: {}",
                event.getDestination(), cityPopularityIndex.get(event.getDestination()));
    }

    public Map<String, Integer> getStats() {
        return cityPopularityIndex;
    }
}