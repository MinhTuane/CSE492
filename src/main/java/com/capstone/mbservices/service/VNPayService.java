package com.capstone.mbservices.service;

import com.capstone.mbservices.config.VNPayConfig;
import com.capstone.mbservices.dto.response.VNPayResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class VNPayService {

    private final VNPayConfig vnPayConfig;

    public String getSecretKey() {
        String key = vnPayConfig.getSecretKey();
        return key != null ? key.trim() : null;
    }

    public VNPayResponse createPayment(double amount, String orderInfo, String orderId,
                                       HttpServletRequest request, String returnUrl) {
        return buildPayment(amount, orderInfo, orderId, request,
                returnUrl != null ? returnUrl : vnPayConfig.getVnp_ReturnUrl());
    }

    public VNPayResponse createPayment(double amount, String orderInfo, String orderId, HttpServletRequest request) {
        return buildPayment(amount, orderInfo, orderId, request, vnPayConfig.getVnp_ReturnUrl());
    }

    private VNPayResponse buildPayment(double amount, String orderInfo, String orderId,
                                       HttpServletRequest request, String returnUrl) {
        String vnp_Version = vnPayConfig.getVnp_Version();
        String vnp_Command = vnPayConfig.getVnp_Command();
        String vnp_OrderInfo = orderInfo;
        String orderType = "other";
        // Append timestamp to ensure uniqueness per attempt.
        // On verify, orderId = txnRef.split("_")[0] (UUID has no underscore).
        String vnp_TxnRef = orderId + "_" + System.currentTimeMillis();
        String vnp_IpAddr = VNPayConfig.getIpAddress(request);
        String vnp_TmnCode = vnPayConfig.getVnp_TmnCode();
        if (vnp_TmnCode != null) {
            vnp_TmnCode = vnp_TmnCode.trim();
        }

        long amountVal = Math.round(amount * 100);

        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", vnp_Version);
        vnp_Params.put("vnp_Command", vnp_Command);
        vnp_Params.put("vnp_TmnCode", vnp_TmnCode);
        vnp_Params.put("vnp_Amount", String.valueOf(amountVal));
        vnp_Params.put("vnp_CurrCode", "VND");
        vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
        vnp_Params.put("vnp_OrderInfo", vnp_OrderInfo);
        vnp_Params.put("vnp_OrderType", orderType);
        vnp_Params.put("vnp_Locale", "vn");
        vnp_Params.put("vnp_ReturnUrl", returnUrl);
        vnp_Params.put("vnp_IpAddr", vnp_IpAddr);

        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        formatter.setTimeZone(TimeZone.getTimeZone("GMT+7"));
        String vnp_CreateDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_CreateDate", vnp_CreateDate);
        
        cld.add(Calendar.MINUTE, 15);
        String vnp_ExpireDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_ExpireDate", vnp_ExpireDate);

        List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = vnp_Params.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8));
                query.append(URLEncoder.encode(fieldName, StandardCharsets.UTF_8).replace("+", "%20"));
                query.append('=');
                query.append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8).replace("+", "%20"));
                if (itr.hasNext()) {
                    query.append('&');
                    hashData.append('&');
                }
            }
        }
        
        String queryUrl = query.toString();
        String secret = getSecretKey();
        
        log.info("[VNPAY-BUILD] Input amount={}, orderId={}, vnp_TmnCode={}, secretKeyLength={}", 
                amount, orderId, vnp_TmnCode, secret != null ? secret.length() : 0);
        log.info("[VNPAY-BUILD] params={}", vnp_Params);
        
        String vnp_SecureHash = VNPayConfig.hmacSHA512(secret, hashData.toString());

        queryUrl += "&vnp_SecureHash=" + vnp_SecureHash;
        String paymentUrl = vnPayConfig.getVnp_PayUrl() + "?" + queryUrl;
        
        log.info("[VNPAY-BUILD] Generated paymentUrl: {}", paymentUrl);
        
        return VNPayResponse.builder()
                .paymentUrl(paymentUrl)
                .orderId(orderId)
                .build();
    }
}
