package com.capstone.mbservices.service;

import com.capstone.mbservices.entity.Order;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebhookService {

    private final WebClient webClient = WebClient.create();

    @Value("${webhook.erp.url:http://localhost:8080/mock-erp-webhook}")
    private String erpWebhookUrl;

    @Value("${webhook.erp.secret:secret-token-123}")
    private String erpWebhookSecret;

    @Async
    public void sendOrderUpdate(Order order) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("event", "ORDER_STATUS_CHANGED");
            payload.put("orderId", order.getId());
            payload.put("orderNumber", order.getOrderNumber());
            payload.put("status", order.getStatus().name());
            payload.put("totalAmount", order.getTotalAmount());
            payload.put("customerId", order.getUser() != null ? order.getUser().getId() : null);
            payload.put("storeId", order.getStore() != null ? order.getStore().getId() : null);
            payload.put("timestamp", java.time.Instant.now().toString());

            webClient.post()
                    .uri(erpWebhookUrl)
                    .header("Authorization", "Bearer " + erpWebhookSecret)
                    .header("Content-Type", "application/json")
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(String.class)
                    .doOnSuccess(response -> log.info("Successfully sent webhook for Order {}: {}", order.getOrderNumber(), response))
                    .doOnError(error -> log.error("Failed to send webhook for Order {}: {}", order.getOrderNumber(), error.getMessage()))
                    .subscribe();

        } catch (Exception e) {
            log.error("Error preparing webhook for Order {}", order.getOrderNumber(), e);
        }
    }
}