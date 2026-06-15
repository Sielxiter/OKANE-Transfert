package com.okane.currencymanagement.domain;

/**
 * Logical currency status surfaced through the admin API.
 * Maps to the boolean {@code active} flag on {@link com.okane.currencyfx.entity.Currency}.
 */
public enum CurrencyStatus {
    ACTIVE,
    SUSPENDED
}
