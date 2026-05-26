package com.capstone.mbservices.service;

import com.capstone.mbservices.config.ZaloPayConfig;
import com.capstone.mbservices.dto.response.VNPayResponse;
import com.capstone.mbservices.utils.HMACUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.text.SimpleDateFormat;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ZaloPayService {

    private final ZaloPayConfig zaloPayConfig;
    private final WebClient webClient = WebClient.create();

    public VNPayResponse createPayment(Double amount, String orderInfo, String orderId) {
        try {
            String app_id = zaloPayConfig.getAppId();
            String key1 = zaloPayConfig.getKey1();
            String endpoint = zaloPayConfig.getEndpoint();

            // ZaloPay limits app_trans_id to 40 chars.
            // UUID with dashes (36) + "yyMMdd_" (7) = 43 chars → exceeds limit.
            // Stripping dashes: 32 + 7 = 39 chars ✅. Dashes are re-inserted on verify.
            String orderIdNoDash = orderId.replace("-", "");
            String app_trans_id = new SimpleDateFormat("yyMMdd").format(new Date()) + "_" + orderIdNoDash;
            String app_user = "MBServices";
            long app_time = System.currentTimeMillis();
            String item = "[{\"itemid\":\"" + orderId + "\",\"itemname\":\"" + orderInfo + "\",\"itemprice\":" + amount.longValue() + ",\"itemquantity\":1}]";
            String redirect = zaloPayConfig.getRedirectUrl();
            if (redirect == null || redirect.isBlank()) {
                redirect = "http://localhost:3001/checkout/payment-result";
            }
            String embed_data = "{\"redirecturl\":\"" + redirect.replace("\\", "\\\\").replace("\"", "\\\"") + "\"}";

            Map<String, Object> order = new HashMap<>();
            order.put("app_id", app_id);
            order.put("app_trans_id", app_trans_id); 
            order.put("app_user", app_user);
            order.put("app_time", app_time);
            order.put("item", item);
            order.put("embed_data", embed_data);
            order.put("amount", amount.longValue());
            order.put("description", orderInfo);
            order.put("bank_code", "zalopayapp");

            String data = app_id +"|"+ app_trans_id +"|"+ app_user +"|"+ amount.longValue() +"|"+ app_time +"|"+ embed_data +"|"+ item;
            
            String mac = HMACUtil.HMacHexStringEncode("HmacSHA256", key1, data);
            order.put("mac", mac);

            Map<String, Object> result = webClient.post()
                    .uri(endpoint)
                    .header("Content-Type", "application/json")
                    .bodyValue(order)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (result != null && (int) result.get("return_code") == 1) {
                return VNPayResponse.builder()
                        .paymentUrl((String) result.get("order_url"))
                        .build();
            } else {
                log.error("ZaloPay creation failed: {}", result);
                return VNPayResponse.builder().build();
            }

        } catch (Exception e) {
            log.error("Error creating ZaloPay payment", e);
            return VNPayResponse.builder().build();
        }
    }

    public Map<String, Object> queryOrder(String appTransId) {
        try {
            String appId = zaloPayConfig.getAppId();
            String key1 = zaloPayConfig.getKey1();
            String endpoint = zaloPayConfig.getEndpoint();
            String queryEndpoint = endpoint != null && endpoint.endsWith("/v2/create")
                    ? endpoint.replace("/v2/create", "/v2/query")
                    : "https://sb-openapi.zalopay.vn/v2/query";

            String data = appId + "|" + appTransId + "|" + key1;
            String mac = HMACUtil.HMacHexStringEncode("HmacSHA256", key1, data);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("app_id", Integer.parseInt(appId));
            requestBody.put("app_trans_id", appTransId);
            requestBody.put("mac", mac);

            Map<String, Object> result = webClient.post()
                    .uri(queryEndpoint)
                    .header("Content-Type", "application/json")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            return result != null ? result : Collections.emptyMap();
        } catch (Exception e) {
            log.error("Error querying ZaloPay order", e);
            return Collections.emptyMap();
        }
    }
}
