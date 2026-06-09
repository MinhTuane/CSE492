package com.capstone.mbservices.controller;

import com.capstone.mbservices.config.VNPayConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@RestController
@RequestMapping("/vnpay") // Access url: http://localhost:8091/api/vnpay/...
@RequiredArgsConstructor
@Slf4j
public class VNPayController {

    private final VNPayConfig vnPayConfig;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostMapping("/pay")
    public ResponseEntity<Map<String, Object>> createPayment(
            @RequestParam("amount") String amountParam,
            @RequestParam(value = "bankCode", required = false) String bankCode,
            @RequestParam(value = "language", required = false) String language,
            HttpServletRequest req) throws Exception {

        String vnp_Version = "2.1.0";
        String vnp_Command = "pay";
        String orderType = "other";
        long amount = Integer.parseInt(amountParam) * 100;

        String vnp_TxnRef = VNPayConfig.getRandomNumber(8);
        String vnp_IpAddr = VNPayConfig.getIpAddress(req);
        String vnp_TmnCode = vnPayConfig.getVnp_TmnCode();

        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", vnp_Version);
        vnp_Params.put("vnp_Command", vnp_Command);
        vnp_Params.put("vnp_TmnCode", vnp_TmnCode);
        vnp_Params.put("vnp_Amount", String.valueOf(amount));
        vnp_Params.put("vnp_CurrCode", "VND");

        if (bankCode != null && !bankCode.isEmpty()) {
            vnp_Params.put("vnp_BankCode", bankCode);
        }
        vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
        vnp_Params.put("vnp_OrderInfo", "Thanh toan don hang:" + vnp_TxnRef);
        vnp_Params.put("vnp_OrderType", orderType);

        if (language != null && !language.isEmpty()) {
            vnp_Params.put("vnp_Locale", language);
        } else {
            vnp_Params.put("vnp_Locale", "vn");
        }
        vnp_Params.put("vnp_ReturnUrl", vnPayConfig.getVnp_ReturnUrl());
        vnp_Params.put("vnp_IpAddr", vnp_IpAddr);

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
                //Build hash data
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                //Build query
                query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII.toString()));
                query.append('=');
                query.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
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

        Map<String, Object> result = new HashMap<>();
        result.put("code", "00");
        result.put("message", "success");
        result.put("data", paymentUrl);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/query")
    public ResponseEntity<String> querydr(
            @RequestParam("order_id") String orderId,
            @RequestParam("trans_date") String transDate,
            HttpServletRequest req) throws Exception {

        String vnp_RequestId = VNPayConfig.getRandomNumber(8);
        String vnp_Version = "2.1.0";
        String vnp_Command = "querydr";
        String vnp_TmnCode = vnPayConfig.getVnp_TmnCode();
        String vnp_TxnRef = orderId;
        String vnp_OrderInfo = "Kiem tra ket qua GD OrderId:" + vnp_TxnRef;
        String vnp_IpAddr = VNPayConfig.getIpAddress(req);

        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        String vnp_CreateDate = formatter.format(cld.getTime());

        Map<String, Object> vnp_Params = new LinkedHashMap<>();
        vnp_Params.put("vnp_RequestId", vnp_RequestId);
        vnp_Params.put("vnp_Version", vnp_Version);
        vnp_Params.put("vnp_Command", vnp_Command);
        vnp_Params.put("vnp_TmnCode", vnp_TmnCode);
        vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
        vnp_Params.put("vnp_OrderInfo", vnp_OrderInfo);
        vnp_Params.put("vnp_TransactionDate", transDate);
        vnp_Params.put("vnp_CreateDate", vnp_CreateDate);
        vnp_Params.put("vnp_IpAddr", vnp_IpAddr);

        String hash_Data = String.join("|", vnp_RequestId, vnp_Version, vnp_Command, vnp_TmnCode, 
                vnp_TxnRef, transDate, vnp_CreateDate, vnp_IpAddr, vnp_OrderInfo);
        String vnp_SecureHash = VNPayConfig.hmacSHA512(vnPayConfig.getSecretKey(), hash_Data);

        vnp_Params.put("vnp_SecureHash", vnp_SecureHash);

        URL url = new URL(vnPayConfig.getVnp_ApiUrl());
        HttpURLConnection con = (HttpURLConnection) url.openConnection();
        con.setRequestMethod("POST");
        con.setRequestProperty("Content-Type", "application/json");
        con.setDoOutput(true);
        try (DataOutputStream wr = new DataOutputStream(con.getOutputStream())) {
            wr.writeBytes(objectMapper.writeValueAsString(vnp_Params));
            wr.flush();
        }
        int responseCode = con.getResponseCode();
        StringBuilder response = new StringBuilder();
        try (BufferedReader in = new BufferedReader(new InputStreamReader(con.getInputStream(), StandardCharsets.UTF_8))) {
            String output;
            while ((output = in.readLine()) != null) {
                response.append(output);
            }
        }
        return ResponseEntity.ok(response.toString());
    }

    @PostMapping("/refund")
    public ResponseEntity<String> refund(
            @RequestParam("trantype") String trantype,
            @RequestParam("order_id") String orderId,
            @RequestParam("amount") String amountParam,
            @RequestParam("trans_date") String transDate,
            @RequestParam("user") String user,
            HttpServletRequest req) throws Exception {

        String vnp_RequestId = VNPayConfig.getRandomNumber(8);
        String vnp_Version = "2.1.0";
        String vnp_Command = "refund";
        String vnp_TmnCode = vnPayConfig.getVnp_TmnCode();
        String vnp_TransactionType = trantype;
        String vnp_TxnRef = orderId;
        long amount = Integer.parseInt(amountParam) * 100;
        String vnp_Amount = String.valueOf(amount);
        String vnp_OrderInfo = "Hoan tien GD OrderId:" + vnp_TxnRef;
        String vnp_TransactionNo = ""; // Assuming value does not exist on your system
        String vnp_IpAddr = VNPayConfig.getIpAddress(req);

        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        String vnp_CreateDate = formatter.format(cld.getTime());

        Map<String, Object> vnp_Params = new LinkedHashMap<>();
        vnp_Params.put("vnp_RequestId", vnp_RequestId);
        vnp_Params.put("vnp_Version", vnp_Version);
        vnp_Params.put("vnp_Command", vnp_Command);
        vnp_Params.put("vnp_TmnCode", vnp_TmnCode);
        vnp_Params.put("vnp_TransactionType", vnp_TransactionType);
        vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
        vnp_Params.put("vnp_Amount", vnp_Amount);
        vnp_Params.put("vnp_OrderInfo", vnp_OrderInfo);

        if (vnp_TransactionNo != null && !vnp_TransactionNo.isEmpty()) {
            vnp_Params.put("vnp_TransactionNo", vnp_TransactionNo);
        }

        vnp_Params.put("vnp_TransactionDate", transDate);
        vnp_Params.put("vnp_CreateBy", user);
        vnp_Params.put("vnp_CreateDate", vnp_CreateDate);
        vnp_Params.put("vnp_IpAddr", vnp_IpAddr);

        String hash_Data = String.join("|", vnp_RequestId, vnp_Version, vnp_Command, vnp_TmnCode, 
                vnp_TransactionType, vnp_TxnRef, vnp_Amount, vnp_TransactionNo, transDate, 
                user, vnp_CreateDate, vnp_IpAddr, vnp_OrderInfo);

        String vnp_SecureHash = VNPayConfig.hmacSHA512(vnPayConfig.getSecretKey(), hash_Data);

        vnp_Params.put("vnp_SecureHash", vnp_SecureHash);

        URL url = new URL(vnPayConfig.getVnp_ApiUrl());
        HttpURLConnection con = (HttpURLConnection) url.openConnection();
        con.setRequestMethod("POST");
        con.setRequestProperty("Content-Type", "application/json");
        con.setDoOutput(true);
        try (DataOutputStream wr = new DataOutputStream(con.getOutputStream())) {
            wr.writeBytes(objectMapper.writeValueAsString(vnp_Params));
            wr.flush();
        }
        int responseCode = con.getResponseCode();
        StringBuilder response = new StringBuilder();
        try (BufferedReader in = new BufferedReader(new InputStreamReader(con.getInputStream(), StandardCharsets.UTF_8))) {
            String output;
            while ((output = in.readLine()) != null) {
                response.append(output);
            }
        }
        return ResponseEntity.ok(response.toString());
    }
}
