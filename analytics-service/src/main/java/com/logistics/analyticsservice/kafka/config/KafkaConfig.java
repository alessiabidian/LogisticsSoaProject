package com.logistics.analyticsservice.kafka.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaConfig {

    @Bean
    public NewTopic routeTopic() {
        return TopicBuilder.name("logistics_routes") // NEW TOPIC NAME
                .partitions(3)
                .replicas(1)
                .build();
    }
}