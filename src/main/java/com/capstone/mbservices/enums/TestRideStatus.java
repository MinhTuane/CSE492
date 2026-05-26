package com.capstone.mbservices.enums;

public enum TestRideStatus {
    SCHEDULED,
    CONFIRMED,
    COMPLETED,
    CANCELLED,
    PENDING,
    NO_SHOW,
    AWAITING_STAFF_CONFIRMATION,
    RESCHEDULE_REQUESTED,
    /** Slot passed without a completed booking flow (tentative / unconfirmed). */
    EXPIRED
}
