package com.okane.transfermanagement.domain;

import java.util.Locale;

/**
 * Logical transfer status surfaced through the admin API. The {@link
 * com.okane.transfer.entity.Transfer} entity stores the status as a string
 * column; this enum is the canonical representation used in DTOs and service
 * logic and provides a tolerant {@link #fromRaw(String)} parser to absorb
 * legacy values.
 */
public enum TransferStatus {
    EN_ATTENTE,
    PAYE,
    ANNULE,
    EXPIRE,
    SUSPECT;

    public static TransferStatus fromRaw(String raw) {
        if (raw == null) return EN_ATTENTE;
        String normalized = raw.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "EN_ATTENTE", "PENDING" -> EN_ATTENTE;
            case "PAYE", "PAID" -> PAYE;
            case "ANNULE", "CANCELLED", "CANCELED" -> ANNULE;
            case "EXPIRE", "EXPIRED" -> EXPIRE;
            case "SUSPECT", "SUSPICIOUS", "BLOCKED" -> SUSPECT;
            default -> EN_ATTENTE;
        };
    }
}
