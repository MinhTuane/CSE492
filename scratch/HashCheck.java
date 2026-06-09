import java.nio.charset.StandardCharsets;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.util.*;
import java.util.stream.Collectors;

public class HashCheck {
    public static String hmacSHA512(final String key, final String data) {
        try {
            final Mac hmac512 = Mac.getInstance("HmacSHA512");
            byte[] hmacKeyBytes = key.getBytes(StandardCharsets.UTF_8);
            final SecretKeySpec secretKey = new SecretKeySpec(hmacKeyBytes, "HmacSHA512");
            hmac512.init(secretKey);
            byte[] dataBytes = data.getBytes(StandardCharsets.UTF_8);
            byte[] result = hmac512.doFinal(dataBytes);
            StringBuilder sb = new StringBuilder(2 * result.length);
            for (byte b : result) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (Exception ex) {
            return "";
        }
    }

    public static void main(String[] args) throws Exception {
        String key = "AQMHYZDUFBAOFXGZOWOAWZELZXYLIZWS";
        
        Map<String, String> params = new TreeMap<>();
        params.put("vnp_Amount", "14876500000");
        params.put("vnp_BankCode", "NCB");
        params.put("vnp_BankTranNo", "VNP15576461");
        params.put("vnp_CardType", "ATM");
        params.put("vnp_OrderInfo", "Thanh doan hang 33dbbd7e-0f0e-483e-ab18-b789f93499fa");
        params.put("vnp_PayDate", "20260609200623");
        params.put("vnp_ResponseCode", "00");
        params.put("vnp_TmnCode", "CMOX1VFG");
        params.put("vnp_TransactionNo", "15576461");
        params.put("vnp_TransactionStatus", "00");
        params.put("vnp_TxnRef", "33dbbd7e-0f0e-483e-ab18-b789f93499fa_1781010363488");

        // UTF-8 encode
        String hashData1 = params.entrySet().stream()
                .map(e -> e.getKey() + "=" + URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8))
                .collect(Collectors.joining("&"));
        System.out.println("UTF-8 key: " + hmacSHA512(key, hashData1));

        // %20 encode
        String hashData2 = params.entrySet().stream()
                .map(e -> e.getKey() + "=" + URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8).replace("+", "%20"))
                .collect(Collectors.joining("&"));
        System.out.println("%20 key: " + hmacSHA512(key, hashData2));

        // Raw
        String hashData3 = params.entrySet().stream()
                .map(e -> e.getKey() + "=" + e.getValue())
                .collect(Collectors.joining("&"));
        System.out.println("Raw key: " + hmacSHA512(key, hashData3));
    }
}
