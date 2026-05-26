package com.capstone.mbservices.service;

import com.capstone.mbservices.config.MomoConfig;
import com.capstone.mbservices.dto.response.VNPayResponse;
import com.capstone.mbservices.utils.HMACUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MomoService {

    private final MomoConfig momoConfig;
    private final WebClient webClient = WebClient.create();

    public VNPayResponse createPayment(Double amount, String orderInfo, String orderId) {
        try {
            String partnerCode = momoConfig.getPartnerCode();
            String accessKey = momoConfig.getAccessKey();
            String secretKey = momoConfig.getSecretKey();
            String endpoint = momoConfig.getEndpoint();
            String redirectUrl = momoConfig.getReturnUrl();
            String ipnUrl = momoConfig.getNotifyUrl();

            String requestId = UUID.randomUUID().toString();
            String amountStr = String.valueOf(amount.longValue());
            String requestType = "captureWallet";
            String extraData = "";

            String rawSignature = "accessKey=" + accessKey
                    + "&amount=" + amountStr
                    + "&extraData=" + extraData
                    + "&ipnUrl=" + ipnUrl
                    + "&orderId=" + orderId
                    + "&orderInfo=" + orderInfo
                    + "&partnerCode=" + partnerCode
                    + "&redirectUrl=" + redirectUrl
                    + "&requestId=" + requestId
                    + "&requestType=" + requestType;

            String signature = HMACUtil.HMacHexStringEncode("HmacSHA256", secretKey, rawSignature);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("partnerCode", partnerCode);
            requestBody.put("requestId", requestId);
            requestBody.put("amount", amount.longValue());
            requestBody.put("orderId", orderId);
            requestBody.put("orderInfo", orderInfo);
            requestBody.put("redirectUrl", redirectUrl);
            requestBody.put("ipnUrl", ipnUrl);
            requestBody.put("requestType", requestType);
            requestBody.put("extraData", extraData);
            requestBody.put("lang", "en");
            requestBody.put("signature", signature);

            Map<String, Object> result = webClient.post()
                    .uri(endpoint)
                    .header("Content-Type", "application/json")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (result != null && result.get("payUrl") != null) {
                return VNPayResponse.builder()
                        .paymentUrl((String) result.get("payUrl"))
                        .orderId(orderId)
                        .build();
            } else {
                log.error("Momo creation failed: {}", result);
                return VNPayResponse.builder().build();
            }

        } catch (Exception e) {
            log.error("Error creating Momo payment", e);
            return VNPayResponse.builder().build();
        }
    }

    public Map<String, Object> verifyIpnAndExtract(Map<String, Object> body) {
        try {
            String signature = body.get("signature") != null ? String.valueOf(body.get("signature")) : null;
            if (signature == null || signature.isBlank()) {
                return Map.of("success", false);
            }

            String accessKey = momoConfig.getAccessKey();
            String secretKey = momoConfig.getSecretKey();

            String rawSignature = "accessKey=" + accessKey
                    + "&amount=" + stringify(body.get("amount"))
                    + "&extraData=" + stringify(body.get("extraData"))
                    + "&message=" + stringify(body.get("message"))
                    + "&orderId=" + stringify(body.get("orderId"))
                    + "&orderInfo=" + stringify(body.get("orderInfo"))
                    + "&orderType=" + stringify(body.get("orderType"))
                    + "&partnerCode=" + stringify(body.get("partnerCode"))
                    + "&payType=" + stringify(body.get("payType"))
                    + "&requestId=" + stringify(body.get("requestId"))
                    + "&responseTime=" + stringify(body.get("responseTime"))
                    + "&resultCode=" + stringify(body.get("resultCode"))
                    + "&transId=" + stringify(body.get("transId"));

            String expected = HMACUtil.HMacHexStringEncode("HmacSHA256", secretKey, rawSignature);
            if (!expected.equalsIgnoreCase(signature)) {
                return Map.of("success", false);
            }

            int resultCode = body.get("resultCode") instanceof Number ? ((Number) body.get("resultCode")).intValue() : -1;
            if (resultCode != 0) {
                return Map.of("success", false);
            }

            String orderId = stringify(body.get("orderId"));
            String transId = stringify(body.get("transId"));
            long amountLong = body.get("amount") instanceof Number ? ((Number) body.get("amount")).longValue() : -1L;
            Map<String, Object> ok = new HashMap<>();
            ok.put("success", true);
            ok.put("orderId", orderId);
            ok.put("transactionId", "MOMO-" + (transId.isBlank() ? String.valueOf(System.currentTimeMillis()) : transId));
            ok.put("amount", amountLong);
            return ok;
        } catch (Exception e) {
            log.error("Error verifying MoMo IPN", e);
            return Map.of("success", false);
        }
    }

    private String stringify(Object value) {
        return value == null ? "" : String.valueOf(value);
    }
}
