/*package com.logistics.analyticsservice.controller;

import com.logistics.analyticsservice.kafka.consumer.AnalyticsConsumer;
import com.logistics.analyticsservice.kafka.producer.AnalyticsProducer;
import com.logistics.analyticsservice.model.RouteEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsProducer analyticsProducer;
    private final AnalyticsConsumer analyticsConsumer;

    // Call this when a shipment is created to feed the algorithm
    @PostMapping("/route")
    public ResponseEntity<String> recordRoute(@RequestBody RouteEvent event) {
        event.setTimestamp(System.currentTimeMillis());
        analyticsProducer.sendRouteData(event);
        return ResponseEntity.ok("Route Data Queued for Analysis");
    }

    // Call this to get the data for your Dashboard/Chart
    @GetMapping("/stats")
    public Map<String, Integer> getStats() {
        return analyticsConsumer.getStats();
    }
}*/

package com.logistics.analyticsservice.controller;

import com.logistics.analyticsservice.kafka.consumer.AnalyticsConsumer;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsConsumer analyticsConsumer;

    @GetMapping("/stats")
    public Map<String, Integer> getStats() {
        return analyticsConsumer.getStats();
    }
}