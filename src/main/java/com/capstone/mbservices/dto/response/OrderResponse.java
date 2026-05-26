package com.capstone.mbservices.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {

    private String id;
    private String orderNumber;

    private String userId;
    private String userEmail;
    private String userName;

    private List<MotorcycleResponse> motorcycles;

    private Double totalAmount;

    private String paymentMethod;
    private String transactionId;
    private String status;

    private LocalDateTime createAt;
}
