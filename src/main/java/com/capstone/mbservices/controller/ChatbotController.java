package com.capstone.mbservices.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.capstone.mbservices.service.ChatbotService;
import com.capstone.mbservices.dto.request.ChatMessageRequest;

import java.util.Map;

@RestController
@RequestMapping("/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;

    @PostMapping("/ask")
    public ResponseEntity<Map<String, String>> askBot(@RequestBody ChatMessageRequest request) {
        String reply = chatbotService.getChatResponse(request.getMessage());
        return ResponseEntity.ok(Map.of("reply", reply));
    }
}
