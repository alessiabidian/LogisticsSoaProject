package com.logistics.shippingservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RouteEvent {
    private String origin;
    private String destination;
    private long timestamp;
}