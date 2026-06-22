package com.capstone.mbservices.controller;

import com.capstone.mbservices.entity.ChatMessage;
import com.capstone.mbservices.entity.ChatRating;
import com.capstone.mbservices.entity.User;
import com.capstone.mbservices.repository.ChatMessageRepository;
import com.capstone.mbservices.repository.ChatRatingRepository;
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
import org.springframework.security.access.prepost.PreAuthorize;
import com.capstone.mbservices.enums.UserRole;

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
    private final ChatRatingRepository chatRatingRepository;

    // In-memory registry of sessions that are currently in Staff Mode
    private static final Map<String, Boolean> activeStaffSessions = new ConcurrentHashMap<>();

    // In-memory registry of staff members allowed to participate in each customer session (for technical staff delegation)
    private static final Map<String, Set<String>> allowedStaffForSession = new ConcurrentHashMap<>();

    // In-memory registry of assigned staff IDs and names
    private static final Map<String, String> assignedStaffId = new ConcurrentHashMap<>();
    private static final Map<String, String> assignedStaffName = new ConcurrentHashMap<>();
    private static final Map<String, String[]> lastAssignedStaff = new ConcurrentHashMap<>();

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
        } else if ("STAFF".equalsIgnoreCase(senderRole) || "ADMIN".equalsIgnoreCase(senderRole) || "STAFF_CS".equalsIgnoreCase(senderRole) || "STAFF_SERVICE".equalsIgnoreCase(senderRole)) {
            // Check if chat is already accepted by someone else
            String currentAssignedId = assignedStaffId.get(customerId);
            if (currentAssignedId != null && !currentAssignedId.equals(request.getSenderId())) {
                Set<String> allowedIds = allowedStaffForSession.get(customerId);
                if (allowedIds == null || !allowedIds.contains(request.getSenderId())) {
                    ChatMessage errorMsg = ChatMessage.builder()
                            .customerId(customerId)
                            .senderRole("SYSTEM")
                            .senderName("System")
                            .content("Phiên chat này đã được nhân viên khác nhận.")
                            .createAt(LocalDateTime.now())
                            .build();
                    return ResponseEntity.status(403).body(List.of(errorMsg));
                }
            }
            // If not assigned yet, automatically assign it to the staff who sent the message
            if (currentAssignedId == null) {
                assignedStaffId.put(customerId, request.getSenderId());
                assignedStaffName.put(customerId, request.getSenderName());
                lastAssignedStaff.put(customerId, new String[]{request.getSenderId(), request.getSenderName()});
            }

            // STAFF_SERVICE role can only send messages if invited/delegated to the session
            if ("STAFF_SERVICE".equalsIgnoreCase(senderRole)) {
                Set<String> allowedIds = allowedStaffForSession.get(customerId);
                if (allowedIds == null || !allowedIds.contains(request.getSenderId())) {
                    ChatMessage errorMsg = ChatMessage.builder()
                            .customerId(customerId)
                            .senderRole("SYSTEM")
                            .senderName("System")
                            .content("You must be invited by Customer Service to join this conversation.")
                            .createAt(LocalDateTime.now())
                            .build();
                    return ResponseEntity.status(403).body(List.of(errorMsg));
                }
            }
            // Staff replied: automatically ensure session is marked as in Staff Mode
            activeStaffSessions.put(customerId, true);
            messagingTemplate.convertAndSend("/topic/chat/" + customerId, userMessage);
            messagingTemplate.convertAndSend("/topic/chat/sessions", Map.of(
                    "action", "message",
                    "customerId", customerId,
                    "assignedStaffId", request.getSenderId(),
                    "assignedStaffName", request.getSenderName()
            ));
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
                    .assignedStaffId(assignedStaffId.get(customerId))
                    .assignedStaffName(assignedStaffName.get(customerId))
                    .allowedStaffIds(allowedStaffForSession.get(customerId))
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
                .content(enable ? "🔄 Transferring your conversation to Customer Service Support Staff..." : "🤖 Switched back to Virtual Assistant mode.")
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

    @PostMapping("/delegate")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF_CS')")
    public ResponseEntity<Map<String, Object>> delegateSession(@RequestBody Map<String, String> payload) {
        String customerId = payload.get("customerId");
        String targetStaffId = payload.get("targetStaffId");
        
        if (customerId == null || customerId.isBlank() || targetStaffId == null || targetStaffId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "customerId and targetStaffId are required"));
        }
        
        User staffUser = userRepository.findById(targetStaffId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Staff user not found"));
        
        if (staffUser.getRole() != UserRole.STAFF_SERVICE) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only staff members with STAFF_SERVICE role can be delegated to"));
        }
        
        // Register the staff member in the allowed session set
        allowedStaffForSession.computeIfAbsent(customerId, k -> ConcurrentHashMap.newKeySet()).add(targetStaffId);
        
        // Build staff name
        String staffName = (staffUser.getFirstname() + " " + staffUser.getLastname()).trim();
        if (staffName.isEmpty()) {
            staffName = staffUser.getUsername();
        }
        
        // Send in-app WebSocket notification to target staff
        String title = "🚨 Chat Session Delegated";
        String message = "You have been invited by Customer Service to join chat session for customer: " + customerId;
        notificationService.sendToUser(staffUser, title, message, "SUPPORT", customerId);
        
        // Log SYSTEM message in history
        ChatMessage systemMsg = ChatMessage.builder()
                .customerId(customerId)
                .senderRole("SYSTEM")
                .senderName("System")
                .content("Customer Service has invited Technical Support " + staffName + " to join this conversation.")
                .createAt(LocalDateTime.now())
                .build();
        chatMessageRepository.save(systemMsg);
        
        // Broadcast updates
        messagingTemplate.convertAndSend("/topic/chat/" + customerId, systemMsg);
        messagingTemplate.convertAndSend("/topic/chat/sessions", Map.of("action", "message", "customerId", customerId));
        
        return ResponseEntity.ok(Map.of("success", true, "customerId", customerId, "delegatedTo", targetStaffId));
    }

    @PostMapping("/accept")
    public ResponseEntity<Map<String, Object>> acceptSession(@RequestBody ChatAcceptRequest request) {
        String customerId = request.getCustomerId();
        String staffId = request.getStaffId();
        String staffName = request.getStaffName();

        activeStaffSessions.put(customerId, true);
        assignedStaffId.put(customerId, staffId);
        assignedStaffName.put(customerId, staffName);
        lastAssignedStaff.put(customerId, new String[]{staffId, staffName});

        String greeting = "Xin chào, tôi là " + staffName + ". Tôi ở đây để hỗ trợ giải đáp các thắc mắc của bạn.";
        ChatMessage welcomeMsg = ChatMessage.builder()
                .customerId(customerId)
                .senderId(staffId)
                .senderName(staffName)
                .senderRole("STAFF")
                .content(greeting)
                .createAt(LocalDateTime.now())
                .build();
        chatMessageRepository.save(welcomeMsg);

        messagingTemplate.convertAndSend("/topic/chat/" + customerId, welcomeMsg);
        messagingTemplate.convertAndSend("/topic/chat/sessions", Map.of(
                "action", "accept",
                "customerId", customerId,
                "staffId", staffId,
                "staffName", staffName
        ));

        return ResponseEntity.ok(Map.of(
                "success", true,
                "customerId", customerId,
                "staffId", staffId,
                "staffName", staffName
        ));
    }

    @PostMapping("/close")
    public ResponseEntity<Map<String, Object>> closeSession(@RequestBody Map<String, String> body) {
        String customerId = body.get("customerId");

        assignedStaffId.remove(customerId);
        assignedStaffName.remove(customerId);
        activeStaffSessions.put(customerId, false);
        allowedStaffForSession.remove(customerId);

        ChatMessage systemMsg = ChatMessage.builder()
                .customerId(customerId)
                .senderRole("SYSTEM")
                .senderName("System")
                .content("🔄 Phiên hỗ trợ trực tuyến đã kết thúc. Bạn vui lòng đánh giá chất lượng phục vụ.")
                .createAt(LocalDateTime.now())
                .build();
        chatMessageRepository.save(systemMsg);

        messagingTemplate.convertAndSend("/topic/chat/" + customerId, systemMsg);
        messagingTemplate.convertAndSend("/topic/chat/sessions", Map.of(
                "action", "close",
                "customerId", customerId
        ));

        return ResponseEntity.ok(Map.of("success", true, "customerId", customerId));
    }

    @PostMapping("/rate")
    public ResponseEntity<Map<String, Object>> rateSession(@RequestBody ChatRateRequest request) {
        String customerId = request.getCustomerId();
        Integer rating = request.getRating();
        String feedback = request.getFeedback();

        String staffId = null;
        String staffName = null;
        String[] staffInfo = lastAssignedStaff.get(customerId);
        if (staffInfo != null && staffInfo.length >= 2) {
            staffId = staffInfo[0];
            staffName = staffInfo[1];
        }

        if (rating != null && rating > 0) {
            ChatRating chatRating = ChatRating.builder()
                    .customerId(customerId)
                    .staffId(staffId)
                    .staffName(staffName)
                    .rating(rating)
                    .feedback(feedback)
                    .build();
            chatRatingRepository.save(chatRating);
        }

        String systemMessageContent = (rating != null && rating > 0)
                ? "🤖 Đã quay lại chế độ Trợ lý ảo. Cảm ơn bạn đã đánh giá!"
                : "🤖 Đã quay lại chế độ Trợ lý ảo.";

        ChatMessage systemMsg = ChatMessage.builder()
                .customerId(customerId)
                .senderRole("SYSTEM")
                .senderName("System")
                .content(systemMessageContent)
                .createAt(LocalDateTime.now())
                .build();
        chatMessageRepository.save(systemMsg);

        messagingTemplate.convertAndSend("/topic/chat/" + customerId, systemMsg);

        return ResponseEntity.ok(Map.of("success", true, "customerId", customerId));
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
    public static class ChatAcceptRequest {
        private String customerId;
        private String staffId;
        private String staffName;
    }

    @Data
    public static class ChatRateRequest {
        private String customerId;
        private Integer rating;
        private String feedback;
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
        private String assignedStaffId;
        private String assignedStaffName;
        private Set<String> allowedStaffIds;
    }
}
