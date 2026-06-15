package com.okane.paymentmanagement.domain;

import java.util.Locale;

/**
 * Logical payment status surfaced through the admin API. The {@link
 * com.okane.cash.entity.Payout} entity stores the status as a nullable string
 * column. A {@code null} or unknown value is mapped to {@link #VALIDE} since
 * every payout currently persisted is, by definition, a successful payment.
 */
public enum PaymentStatus {
    EN_ATTENTE,
    VALIDE,
    ECHOUE,
    ANNULE,
    BLOQUE;

    public static PaymentStatus fromRaw(String raw) {
        if (raw == null) return VALIDE;
        String normalized = raw.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "EN_ATTENTE", "PENDING" -> EN_ATTENTE;
            case "VALIDE", "VALIDATED", "PAID" -> VALIDE;
            case "ECHOUE", "FAILED" -> ECHOUE;
            case "ANNULE", "CANCELLED", "CANCELED" -> ANNULE;
            case "BLOQUE", "BLOCKED" -> BLOQUE;
            default -> VALIDE;
        };
    }
}
