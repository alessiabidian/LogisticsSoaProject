package com.logistics.functionservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod; // Import this
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.cors.CorsConfigurationSource;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // 1. Disable CSRF (Not needed for this service)
                .csrf(csrf -> csrf.disable())

                // 2. Enable CORS with our custom config
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // 3. Authorization Rules
                .authorizeHttpRequests(auth -> auth
                        // CRITICAL: Explicitly allow OPTIONS requests from anywhere
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // Allow the actual generation endpoint
                        .requestMatchers("/api/waybills/**").permitAll()
                        // Allow everything else for this demo service
                        .anyRequest().permitAll()
                );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Be specific about the Frontend URL to satisfy strict browsers
        configuration.setAllowedOrigins(List.of("http://localhost:4200"));

        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true); // Allow cookies/headers if needed

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}