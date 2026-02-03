package com.logistics.shippingservice.rabbitmq.producer;

import com.logistics.shippingservice.rabbitmq.config.RabbitMqConfig;
import com.logistics.shippingservice.dto.ShipmentEvent;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ShipmentProducer {

    private static final Logger LOGGER = LoggerFactory.getLogger(ShipmentProducer.class);
    private final RabbitTemplate rabbitTemplate;

    public void sendMessage(ShipmentEvent event) {
        LOGGER.info(String.format("Order placed -> Sending message to RabbitMQ: %s", event.toString()));

        rabbitTemplate.convertAndSend(RabbitMqConfig.EXCHANGE, RabbitMqConfig.ROUTING_KEY, event);
    }
}
