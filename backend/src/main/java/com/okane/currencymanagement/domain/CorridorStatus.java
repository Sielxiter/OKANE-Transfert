package com.okane.currencymanagement.domain;

/**
 * Logical corridor status surfaced through the admin API. {@code DISABLED} maps
 * to {@code active = false} on the legacy {@link com.okane.currencyfx.entity.TransferCorridor}.
 * {@code UNDER_REVIEW} is reserved for future use; currently no rows expose it.
 */
public enum CorridorStatus {
    ACTIVE,
    DISABLED,
    UNDER_REVIEW
}
