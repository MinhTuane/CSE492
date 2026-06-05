package com.capstone.mbservices.service;

import com.capstone.mbservices.config.VNPayConfig;
import com.capstone.mbservices.dto.response.VNPayResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@Service
@RequiredArgsConstructor
public class VNPayService {

    private final VNPayConfig vnPayConfig;

    public String getSecretKey() {
        return vnPayConfig.getSecretKey();
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

        int amountVal = (int) (amount * 100);
        
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
        String notifyUrl = vnPayConfig.getVnp_NotifyUrl();
        if (notifyUrl != null && !notifyUrl.isBlank()) {
            vnp_Params.put("vnp_NotifyUrl", notifyUrl);
        }

        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
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
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII));
                query.append('=');
                query.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                if (itr.hasNext()) {
                    query.append('&');
                    hashData.append('&');
                }
            }
        }
        
        String queryUrl = query.toString();
        String vnp_SecureHash = VNPayConfig.hmacSHA512(vnPayConfig.getSecretKey(), hashData.toString());
        queryUrl += "&vnp_SecureHash=" + vnp_SecureHash;
        String paymentUrl = vnPayConfig.getVnp_PayUrl() + "?" + queryUrl;
        
        return VNPayResponse.builder()
                .paymentUrl(paymentUrl)
                .orderId(orderId)
                .build();
    }
}
