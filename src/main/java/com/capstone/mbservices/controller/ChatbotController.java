package com.capstone.mbservices.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.capstone.mbservices.service.ChatbotService;
import com.capstone.mbservices.service.NotificationService;
import com.capstone.mbservices.dto.request.ChatMessageRequest;

import java.util.Map;

@RestController
@RequestMapping("/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;
    private final NotificationService notificationService;

    @PostMapping("/ask")
    public ResponseEntity<Map<String, String>> askBot(@RequestBody ChatMessageRequest request) {
        String reply = chatbotService.getChatResponse(request.getMessage(), null);
        return ResponseEntity.ok(Map.of("reply", reply));
    }

    @PostMapping("/request-staff")
    public ResponseEntity<Map<String, String>> requestStaff(@RequestBody Map<String, String> request) {
        String userName = request.getOrDefault("userName", "Guest User");
        String userEmail = request.getOrDefault("userEmail", "Not Logged In");
        
        String title = "🚨 Customer requests live support!";
        String message = String.format("Customer %s (%s) has requested a live connection with support staff via the Chat Widget!", userName, userEmail);
        
        notificationService.sendToAdmin(title, message, "SUPPORT", null);
        
        return ResponseEntity.ok(Map.of("status", "success", "message", "Staff notified successfully"));
    }
}
