package com.capstone.mbservices.enums;

public enum ServiceStatus {
    SCHEDULED,
    IN_PROGRESS,
    COMPLETED,
    CANCELLED,
    NO_SHOW,
    /** Booking was never started or closed after the scheduled window. */
    EXPIRED
}
