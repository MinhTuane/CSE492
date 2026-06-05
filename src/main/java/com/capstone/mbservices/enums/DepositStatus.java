package com.capstone.mbservices.enums;

public enum DepositStatus {
    PENDING,    // booking created, deposit not yet paid
    PAID,       // deposit successfully paid via payment gateway
    REFUNDED,   // deposit refunded (cancelled in allowed window)
    FORFEITED   // deposit forfeited (no-show or late cancellation)
}
