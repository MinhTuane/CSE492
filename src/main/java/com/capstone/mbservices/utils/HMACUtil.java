package com.capstone.mbservices.utils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

public class HMACUtil {
    public static String HMacHexStringEncode(String algorithm, String key, String data) {
        try {
            Mac mac = Mac.getInstance(algorithm);
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes("UTF-8"), algorithm);
            mac.init(secretKey);
            byte[] hash = mac.doFinal(data.getBytes("UTF-8"));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate HMAC", e);
        }
    }
}
