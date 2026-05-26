package com.capstone.mbservices.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class VNPayResponse {
    private String paymentUrl;
    private String orderId;
}
