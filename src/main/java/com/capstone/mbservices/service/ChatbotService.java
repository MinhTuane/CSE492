package com.capstone.mbservices.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Service
@Slf4j
public class ChatbotService {

    private final WebClient webClient;

    public ChatbotService(@Value("${chatbot.service.url:http://localhost:5000/chat}") String chatbotApiUrl, WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.baseUrl(chatbotApiUrl).build();
    }

    public String getChatResponse(String userMessage) {
        try {
            Map<String, String> requestBody = Map.of("message", userMessage);

            Map<String, Object> response = webClient.post()
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response != null && "success".equals(response.get("status"))) {
                return (String) response.get("response");
            }
        } catch (Exception e) {
            log.error("Error communicating with Python Chatbot service: {}", e.getMessage());
        }

        return "Sorry, the chatbot is currently experiencing connection issues. Please make sure the Python Chatbot Microservice (port 5000) is running, or contact our Hotline at 1900 1234!";
    }
}
