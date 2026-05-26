package com.capstone.mbservices.utils;

/**
 * VND amounts are whole currency units; avoid float drift in totals and payment checks.
 */
public final class MoneyUtil {

    private MoneyUtil() {
    }

    public static long roundVnd(Double amount) {
        if (amount == null) {
            return 0L;
        }
        return Math.round(amount);
    }

    public static double roundVndDouble(double amount) {
        return Math.round(amount);
    }

    public static double roundVndDouble(Double amount) {
        return amount == null ? 0.0 : Math.round(amount);
    }
}
