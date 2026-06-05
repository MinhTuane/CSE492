package com.capstone.mbservices.service;

import com.capstone.mbservices.entity.Order;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EInvoiceService {

    public void generateInvoice(Order order) {
        if (order == null) return;
        
        double subTotal = order.getTotalAmount();
        double vatAmount = subTotal * 0.10; // 10% VAT
        double finalTotal = subTotal + vatAmount;

        log.info("===============================================");
        log.info("========== ELECTRONIC INVOICE (VAT) ==========");
        log.info("===============================================");
        log.info("Invoice Number  : INV-{}", order.getOrderNumber());
        log.info("Customer Name   : {}", order.getUser() != null 
            ? (order.getUser().getFirstname() + " " + order.getUser().getLastname()) 
            : "Walking Customer");
        log.info("Subtotal        : {} VND", String.format("%,.0f", subTotal));
        log.info("Value Added Tax : {} VND (10% VAT)", String.format("%,.0f", vatAmount));
        log.info("Final Total     : {} VND", String.format("%,.0f", finalTotal));
        log.info("Payment Status  : PAID / COMPLETED");
        log.info("===============================================");
    }
}
