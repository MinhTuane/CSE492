package com.capstone.mbservices.controller;

import com.capstone.mbservices.entity.ChatMessage;
import com.capstone.mbservices.entity.User;
import com.capstone.mbservices.repository.ChatMessageRepository;
import com.capstone.mbservices.repository.UserRepository;
import com.capstone.mbservices.service.ChatbotService;
import com.capstone.mbservices.service.NotificationService;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
@Slf4j
public class ChatController {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final ChatbotService chatbotService;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    // In-memory registry of sessions that are currently in Staff Mode
    private static final Map<String, Boolean> activeStaffSessions = new ConcurrentHashMap<>();

    @GetMapping("/history")
    public ResponseEntity<List<ChatMessage>> getChatHistory(@RequestParam String customerId) {
        List<ChatMessage> history = chatMessageRepository.findByCustomerIdOrderByCreateAtAsc(customerId);
        
        // If history is empty and it's a customer, we can seed an initial welcome message
        if (history.isEmpty()) {
            ChatMessage welcome = ChatMessage.builder()
                    .customerId(customerId)
                    .senderRole("BOT")
                    .senderName("MBServices Assistant")
                    .content("Hello! I am the MBServices virtual assistant. How can I help you today (search for bikes, book a test ride, request maintenance...)?")
                    .createAt(LocalDateTime.now())
                    .build();
            history = List.of(welcome);
        }
        return ResponseEntity.ok(history);
    }

    @PostMapping("/send")
    public ResponseEntity<List<ChatMessage>> sendMessage(@RequestBody ChatMessageRequest request) {
        String customerId = request.getCustomerId();
        String senderRole = request.getSenderRole();
        
        // 1. Create and save the sender's message
        ChatMessage userMessage = ChatMessage.builder()
                .customerId(customerId)
                .senderId(request.getSenderId())
                .senderName(request.getSenderName())
                .senderRole(senderRole)
                .content(request.getContent())
                .createAt(LocalDateTime.now())
                .build();
        
        chatMessageRepository.save(userMessage);

        List<ChatMessage> result = new ArrayList<>();
        result.add(userMessage);

        // 2. Determine routing logic
        if ("CUSTOMER".equalsIgnoreCase(senderRole)) {
            boolean isStaffMode = activeStaffSessions.getOrDefault(customerId, false);
            
            if (isStaffMode) {
                // Real-time broadcast to the customer's WS topic and the staff general updates channel
                messagingTemplate.convertAndSend("/topic/chat/" + customerId, userMessage);
                messagingTemplate.convertAndSend("/topic/chat/sessions", Map.of("action", "message", "customerId", customerId));
            } else {
                // AI Bot Mode: Get chatbot reply
                List<ChatMessage> allMessages = chatMessageRepository.findByCustomerIdOrderByCreateAtAsc(customerId);
                List<Map<String, String>> history = new ArrayList<>();
                int start = Math.max(0, allMessages.size() - 11);
                int end = Math.max(0, allMessages.size() - 1); // exclude current message
                for (int i = start; i < end; i++) {
                    ChatMessage m = allMessages.get(i);
                    if ("SYSTEM".equals(m.getSenderRole())) continue;
                    Map<String, String> msgMap = new HashMap<>();
                    msgMap.put("role", "BOT".equals(m.getSenderRole()) ? "model" : "user");
                    msgMap.put("content", m.getContent());
                    history.add(msgMap);
                }
                
                String botReply = chatbotService.getChatResponse(request.getContent(), history);
                ChatMessage botMessage = ChatMessage.builder()
                        .customerId(customerId)
                        .senderRole("BOT")
                        .senderName("MBServices Assistant")
                        .content(botReply)
                        .createAt(LocalDateTime.now())
                        .build();
                chatMessageRepository.save(botMessage);
                result.add(botMessage);
            }
        } else if ("STAFF".equalsIgnoreCase(senderRole) || "ADMIN".equalsIgnoreCase(senderRole)) {
            // Staff replied: automatically ensure session is marked as in Staff Mode
            activeStaffSessions.put(customerId, true);
            messagingTemplate.convertAndSend("/topic/chat/" + customerId, userMessage);
            messagingTemplate.convertAndSend("/topic/chat/sessions", Map.of("action", "message", "customerId", customerId));
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/sessions")
    public ResponseEntity<List<ChatSessionResponse>> getActiveSessions() {
        List<String> customerIds = chatMessageRepository.findActiveCustomerIds();
        List<ChatSessionResponse> sessions = new ArrayList<>();

        for (String customerId : customerIds) {
            // Find last message
            List<ChatMessage> messages = chatMessageRepository.findByCustomerIdOrderByCreateAtAsc(customerId);
            if (messages.isEmpty()) continue;
            
            ChatMessage lastMsg = messages.get(messages.size() - 1);
            
            // Look up customer info
            String customerName = "Guest User";
            String customerEmail = "";
            if (!customerId.startsWith("guest_")) {
                Optional<User> userOpt = userRepository.findById(customerId);
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    customerName = (user.getFirstname() + " " + user.getLastname()).trim();
                    if (customerName.isEmpty()) {
                        customerName = user.getUsername();
                    }
                    customerEmail = user.getEmail();
                }
            } else {
                customerName = "Guest (" + customerId.substring(Math.min(customerId.length(), 10)) + ")";
            }

            sessions.add(ChatSessionResponse.builder()
                    .customerId(customerId)
                    .customerName(customerName)
                    .customerEmail(customerEmail)
                    .lastMessage(lastMsg.getContent())
                    .lastMessageTime(lastMsg.getCreateAt())
                    .isWaitingForStaff(activeStaffSessions.getOrDefault(customerId, false))
                    .build());
        }
        
        return ResponseEntity.ok(sessions);
    }

    @PostMapping("/toggle-staff")
    public ResponseEntity<Map<String, Object>> toggleStaff(@RequestBody Map<String, Object> body) {
        String customerId = (String) body.get("customerId");
        boolean enable = (Boolean) body.get("enable");
        
        activeStaffSessions.put(customerId, enable);
        
        // Broadcast session list update to staff
        messagingTemplate.convertAndSend("/topic/chat/sessions", Map.of(
                "action", "toggle",
                "customerId", customerId,
                "enable", enable
        ));

        // Add a system message to the log
        ChatMessage systemMsg = ChatMessage.builder()
                .customerId(customerId)
                .senderRole("SYSTEM")
                .senderName("System")
                .content(enable ? "🔄 Transferring your conversation to CSKH Support Staff..." : "🤖 Switched back to Virtual Assistant mode.")
                .createAt(LocalDateTime.now())
                .build();
        chatMessageRepository.save(systemMsg);
        
        // Broadcast the system message to the chat channel
        messagingTemplate.convertAndSend("/topic/chat/" + customerId, systemMsg);

        if (enable) {
            // Send email / admin push alert
            String userName = "Guest User";
            String userEmail = "Not Logged In";
            if (!customerId.startsWith("guest_")) {
                Optional<User> userOpt = userRepository.findById(customerId);
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    userName = (user.getFirstname() + " " + user.getLastname()).trim();
                    userEmail = user.getEmail();
                }
            }
            String title = "🚨 Customer requests live support!";
            String message = String.format("Customer %s (%s) has requested a live connection with support staff via the Chat Widget!", userName, userEmail);
            notificationService.sendToAdmin(title, message, "SUPPORT", null);
        }

        return ResponseEntity.ok(Map.of("success", true, "customerId", customerId, "isStaffMode", enable));
    }

    @Data
    public static class ChatMessageRequest {
        private String customerId;
        private String senderId;
        private String senderName;
        private String senderRole;
        private String content;
    }

    @Data
    @Builder
    public static class ChatSessionResponse {
        private String customerId;
        private String customerName;
        private String customerEmail;
        private String lastMessage;
        private LocalDateTime lastMessageTime;
        private boolean isWaitingForStaff;
    }
}
