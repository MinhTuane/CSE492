package com.capstone.mbservices.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.capstone.mbservices.entity.Order;
import com.capstone.mbservices.dto.request.OrderRequest;
import com.capstone.mbservices.dto.response.VNPayResponse;
import com.capstone.mbservices.enums.OrderStatus;
import com.capstone.mbservices.service.OrderService;
import com.capstone.mbservices.service.VNPayService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/orders")  // NO /api prefix!
@RequiredArgsConstructor
@Slf4j
public class OrderController {
    private final OrderService orderService;
    private final VNPayService vnPayService;
    private final com.capstone.mbservices.service.ZaloPayService zaloPayService;
    private final com.capstone.mbservices.service.MomoService momoService;
    
    @PostMapping
    @PreAuthorize("#request.userId == authentication.principal.id or hasAnyRole('ADMIN', 'SUPER_ADMIN', 'BRANCH_MANAGER', 'SALES_STAFF', 'SERVICE_ADVISOR')")
    public ResponseEntity<Order> create(@Valid @RequestBody OrderRequest request) {
        return ResponseEntity.ok(orderService.createOrder(request));
    }
    
    @PostMapping("/{id}/vnpay-url")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN') or @orderRepository.findById(#id).orElse(null)?.user?.id == authentication.principal.id")
    public ResponseEntity<VNPayResponse> createVNPayUrl(@PathVariable String id, HttpServletRequest request) {
        Order order = orderService.getOrderById(id);
        String orderInfo = "Thanh toan don hang " + id;
        double amountToPay = Boolean.TRUE.equals(order.getIsDeposit()) ? order.getDepositAmount() : order.getTotalAmount();
        VNPayResponse response = vnPayService.createPayment(amountToPay, orderInfo, id, request);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/{id}/zalopay-url")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN') or @orderRepository.findById(#id).orElse(null)?.user?.id == authentication.principal.id")
    public ResponseEntity<VNPayResponse> createZaloPayUrl(@PathVariable String id) {
        Order order = orderService.getOrderById(id);
        String orderInfo = "Thanh toan don hang " + id;
        double amountToPay = Boolean.TRUE.equals(order.getIsDeposit()) ? order.getDepositAmount() : order.getTotalAmount();
        VNPayResponse response = zaloPayService.createPayment(amountToPay, orderInfo, id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/momo-url")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN') or @orderRepository.findById(#id).orElse(null)?.user?.id == authentication.principal.id")
    public ResponseEntity<VNPayResponse> createMomoUrl(@PathVariable String id) {
        Order order = orderService.getOrderById(id);
        String orderInfo = "Thanh toan don hang " + id;
        double amountToPay = Boolean.TRUE.equals(order.getIsDeposit()) ? order.getDepositAmount() : order.getTotalAmount();
        VNPayResponse response = momoService.createPayment(amountToPay, orderInfo, id);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'BRANCH_MANAGER', 'STAFF', 'SALES_STAFF', 'SERVICE_ADVISOR') or @orderRepository.findById(#id).orElse(null)?.user?.id == authentication.principal.id")
    public ResponseEntity<Order> getById(@PathVariable String id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }
    
    @GetMapping("/user/{userId}")
    @PreAuthorize("#userId == authentication.principal.id or hasAnyRole('ADMIN', 'SUPER_ADMIN', 'BRANCH_MANAGER', 'STAFF', 'SALES_STAFF', 'SERVICE_ADVISOR')")
    public ResponseEntity<List<Order>> getUserOrders(@PathVariable String userId) {
        return ResponseEntity.ok(orderService.getUserOrders(userId));
    }
    
    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'BRANCH_MANAGER', 'STAFF', 'SALES_STAFF', 'SERVICE_ADVISOR')")
    public ResponseEntity<Order> updateStatus(@PathVariable String id, @RequestParam OrderStatus status) {
        return ResponseEntity.ok(orderService.updateOrderStatus(id, status));
    }
    
    /**
     * Manual payment override - SUPER_ADMIN only.
     * For exceptional cases (e.g., offline payment reconciliation).
     * Requires a non-blank reason for audit purposes.
     */
    @PostMapping("/{id}/payment")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Order> processPayment(
            @PathVariable String id,
            @RequestParam String transactionId,
            @RequestParam String reason) {
        if (reason == null || reason.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(orderService.processManualPayment(id, transactionId, reason));
    }

    @GetMapping("/vnpay/verify")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Order> verifyVNPayCallback(@RequestParam Map<String, String> params) {
        String secureHash = params.get("vnp_SecureHash");
        if (secureHash == null || secureHash.isBlank()) {
            log.warn("[VNPAY-VERIFY] Missing vnp_SecureHash in params={}", params);
            return ResponseEntity.badRequest().build();
        }
        String responseCode = params.get("vnp_ResponseCode");
        String txnRef = params.get("vnp_TxnRef");
        if (txnRef == null || txnRef.isBlank()) {
            log.warn("[VNPAY-VERIFY] Missing vnp_TxnRef in params={}", params);
            return ResponseEntity.badRequest().build();
        }
        // txnRef format is "orderId_timestamp" (UUID has no underscores).
        String orderId = txnRef.contains("_") ? txnRef.split("_")[0] : txnRef;

        // Verify order exists and is in correct state
        Order order = orderService.getOrderById(orderId);
        if (order.getStatus() == OrderStatus.PAID) {
            // Already paid, prevent duplicate processing
            return ResponseEntity.ok(order);
        }

        Map<String, String> filtered = params.entrySet().stream()
                .filter(e -> e.getKey() != null && e.getKey().startsWith("vnp_"))
                .filter(e -> !"vnp_SecureHash".equals(e.getKey()))
                .filter(e -> !"vnp_SecureHashType".equals(e.getKey()))
                .filter(e -> e.getValue() != null && !e.getValue().isBlank())
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (a, b) -> a, TreeMap::new));

        String hashData = filtered.entrySet().stream()
                .map(e -> e.getKey() + "=" + java.net.URLEncoder.encode(e.getValue(), java.nio.charset.StandardCharsets.UTF_8))
                .collect(Collectors.joining("&"));

        String expectedHash = com.capstone.mbservices.config.VNPayConfig.hmacSHA512(vnPayService.getSecretKey(), hashData);

        if (!expectedHash.equalsIgnoreCase(secureHash)) {
            log.warn("[VNPAY-VERIFY] Signature mismatch. expected={}, got={}, hashData={}, key={}", 
                    expectedHash, secureHash, hashData, 
                    vnPayService.getSecretKey() != null && vnPayService.getSecretKey().length() > 4 
                            ? vnPayService.getSecretKey().substring(0, 4) + "..." 
                            : "null");
            return ResponseEntity.status(400).build();
        }

        if (!"00".equals(responseCode)) {
            log.warn("[VNPAY-VERIFY] ResponseCode is not 00, responseCode={}, params={}", responseCode, params);
            return ResponseEntity.status(400).build();
        }

        String vnpAmount = params.get("vnp_Amount");
        double amountToPay = Boolean.TRUE.equals(order.getIsDeposit()) ? order.getDepositAmount() : order.getTotalAmount();
        long expectedAmount = Math.round(amountToPay * 100);
        if (vnpAmount == null || !String.valueOf(expectedAmount).equals(vnpAmount)) {
            log.warn("[VNPAY-VERIFY] Amount mismatch. expectedAmount={} (long value of {} * 100), got vnp_Amount={}", 
                    expectedAmount, amountToPay, vnpAmount);
            return ResponseEntity.status(400).build();
        }

        String txn = params.getOrDefault("vnp_TransactionNo", String.valueOf(System.currentTimeMillis()));
        return ResponseEntity.ok(orderService.processPayment(orderId, "VNPAY-" + txn));
    }

    /**
     * VNPay IPN (Instant Payment Notification) - server-to-server callback.
     * VNPay calls this URL directly; no user auth. Must return {"RspCode":"00","Message":"Confirm Success"}.
     * Spec: https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.md#ipn-url
     */
    @GetMapping("/vnpay-ipn")
    public ResponseEntity<Map<String, String>> vnpayIpn(@RequestParam Map<String, String> params) {
        try {
            String secureHash = params.get("vnp_SecureHash");
            if (secureHash == null || secureHash.isBlank()) {
                log.warn("[VNPAY-IPN] Missing vnp_SecureHash");
                return ResponseEntity.ok(Map.of("RspCode", "97", "Message", "Invalid Signature"));
            }

            Map<String, String> filtered = params.entrySet().stream()
                    .filter(e -> e.getKey() != null && e.getKey().startsWith("vnp_"))
                    .filter(e -> !"vnp_SecureHash".equals(e.getKey()))
                    .filter(e -> !"vnp_SecureHashType".equals(e.getKey()))
                    .filter(e -> e.getValue() != null && !e.getValue().isBlank())
                    .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (a, b) -> a, TreeMap::new));

            String hashData = filtered.entrySet().stream()
                    .map(e -> e.getKey() + "=" + java.net.URLEncoder.encode(e.getValue(), java.nio.charset.StandardCharsets.UTF_8))
                    .collect(Collectors.joining("&"));

            String expectedHash = com.capstone.mbservices.config.VNPayConfig.hmacSHA512(vnPayService.getSecretKey(), hashData);
            if (!expectedHash.equalsIgnoreCase(secureHash)) {
                log.warn("[VNPAY-IPN] Signature mismatch. params={}", params);
                return ResponseEntity.ok(Map.of("RspCode", "97", "Message", "Invalid Signature"));
            }

            String txnRef = params.get("vnp_TxnRef");
            if (txnRef == null || txnRef.isBlank()) {
                return ResponseEntity.ok(Map.of("RspCode", "01", "Message", "Order Not Found"));
            }
            String orderId = txnRef.contains("_") ? txnRef.split("_")[0] : txnRef;

            Order order;
            try {
                order = orderService.getOrderById(orderId);
            } catch (Exception e) {
                log.error("[VNPAY-IPN] Order not found: {}", orderId);
                return ResponseEntity.ok(Map.of("RspCode", "01", "Message", "Order Not Found"));
            }

            if (order.getStatus() == OrderStatus.PAID) {
                log.info("[VNPAY-IPN] Order {} already PAID, ignoring duplicate.", orderId);
                return ResponseEntity.ok(Map.of("RspCode", "02", "Message", "Order Already Confirmed"));
            }

            String responseCode = params.get("vnp_ResponseCode");
            if (!"00".equals(responseCode)) {
                log.info("[VNPAY-IPN] Payment not successful for order={}, responseCode={}", orderId, responseCode);
                return ResponseEntity.ok(Map.of("RspCode", "00", "Message", "Confirm Success"));
            }

            String vnpAmount = params.get("vnp_Amount");
            double amountToPay = Boolean.TRUE.equals(order.getIsDeposit()) ? order.getDepositAmount() : order.getTotalAmount();
            long expectedAmount = Math.round(amountToPay * 100);
            if (vnpAmount == null || !String.valueOf(expectedAmount).equals(vnpAmount)) {
                log.error("[VNPAY-IPN] Amount mismatch for order={}: expected={} got={}", orderId, expectedAmount, vnpAmount);
                return ResponseEntity.ok(Map.of("RspCode", "04", "Message", "Invalid Amount"));
            }

            String txn = params.getOrDefault("vnp_TransactionNo", txnRef);
            orderService.processPayment(orderId, "VNPAY-" + txn);
            log.info("[VNPAY-IPN] Payment processed for order={} txn={}", orderId, txn);
            return ResponseEntity.ok(Map.of("RspCode", "00", "Message", "Confirm Success"));

        } catch (Exception e) {
            log.error("[VNPAY-IPN] Unexpected error: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of("RspCode", "99", "Message", "Unknown Error"));
        }
    }

    @GetMapping("/zalopay/verify")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Order> verifyZaloPayCallback(@RequestParam String apptransid) {
        if (apptransid == null || apptransid.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        // app_trans_id = "yyMMdd_<uuidNoDashes>". Extract the uuid part and re-insert dashes.
        String raw = apptransid.contains("_") ? apptransid.split("_", 2)[1] : apptransid;
        String orderId = restoreUuidDashes(raw);

        // Verify order exists and is in correct state
        Order order = orderService.getOrderById(orderId);
        if (order.getStatus() == OrderStatus.PAID) {
            // Already paid, prevent duplicate processing
            return ResponseEntity.ok(order);
        }
        
        Map<String, Object> query = zaloPayService.queryOrder(apptransid);
        Object returnCodeObj = query.get("return_code");
        int returnCode = returnCodeObj instanceof Number ? ((Number) returnCodeObj).intValue() : -1;
        if (returnCode != 1) {
            return ResponseEntity.status(400).build();
        }
        Object amountObj = query.get("amount");
        long paidAmount = amountObj instanceof Number ? ((Number) amountObj).longValue() : -1L;
        long expected = Math.round((Boolean.TRUE.equals(order.getIsDeposit()) ? order.getDepositAmount() : order.getTotalAmount()));
        if (paidAmount != expected) {
            return ResponseEntity.status(400).build();
        }
        return ResponseEntity.ok(orderService.processPayment(orderId, "ZALOPAY-" + query.getOrDefault("zp_trans_id", apptransid)));
    }

    @PostMapping("/momo-ipn")
    public ResponseEntity<Map<String, String>> momoIpn(@RequestBody Map<String, Object> body) {
        try {
            Map<String, Object> verified = momoService.verifyIpnAndExtract(body);
            if (!Boolean.TRUE.equals(verified.get("success"))) {
                log.warn("[MOMO-IPN] Signature verification failed or non-zero resultCode. body={}", body);
                return ResponseEntity.status(400).body(Map.of("status", "invalid"));
            }
            String orderId = (String) verified.get("orderId");
            String transactionId = (String) verified.get("transactionId");
            Object amtObj = verified.get("amount");
            long ipnAmount = amtObj instanceof Number ? ((Number) amtObj).longValue() : -1L;

            if (orderId == null || orderId.isBlank()) {
                log.error("[MOMO-IPN] Missing orderId in verified payload. body={}", body);
                return ResponseEntity.status(400).body(Map.of("status", "missing_order_id"));
            }
            
            // Verify order exists and is in correct state
            Order order = orderService.getOrderById(orderId);
            if (order.getStatus() == OrderStatus.PAID) {
                log.info("[MOMO-IPN] Order {} already PAID, ignoring duplicate IPN.", orderId);
                return ResponseEntity.ok(Map.of("status", "ok"));
            }
            
            double amountToPay = Boolean.TRUE.equals(order.getIsDeposit()) ? order.getDepositAmount() : order.getTotalAmount();
            long expected = Math.round(amountToPay);
            if (ipnAmount < 0 || ipnAmount != expected) {
                log.error("[MOMO-IPN] Amount mismatch for order={}: expected={} got={}", orderId, expected, ipnAmount);
                return ResponseEntity.status(400).body(Map.of("status", "amount_mismatch"));
            }
            orderService.processPayment(orderId, transactionId);
            log.info("[MOMO-IPN] Payment processed for order={} txn={}", orderId, transactionId);
            return ResponseEntity.ok(Map.of("status", "ok"));
        } catch (Exception e) {
            log.error("[MOMO-IPN] Unexpected error processing IPN: {}", e.getMessage(), e);
            return ResponseEntity.status(400).body(Map.of("status", "error"));
        }
    }
    
    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'BRANCH_MANAGER', 'STAFF', 'SALES_STAFF', 'SERVICE_ADVISOR')")
    public ResponseEntity<Map<String, Object>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        
        Page<Order> orderPage = orderService.getOrders(page, size, status, search);
        
        Map<String, Object> response = new HashMap<>();
        response.put("content", orderPage.getContent());
        response.put("currentPage", orderPage.getNumber());
        response.put("totalItems", orderPage.getTotalElements());
        response.put("totalPages", orderPage.getTotalPages());
        
        return ResponseEntity.ok(response);
    }

    /**
     * Reconstruct a standard UUID (8-4-4-4-12) from a dash-stripped 32-char string.
     * Used for ZaloPay app_trans_id parsing where UUID dashes were removed to fit the 40-char limit.
     */
    private String restoreUuidDashes(String s) {
        if (s == null || s.length() != 32) return s;
        return s.substring(0, 8) + "-"
             + s.substring(8, 12) + "-"
             + s.substring(12, 16) + "-"
             + s.substring(16, 20) + "-"
             + s.substring(20);
    }
}
