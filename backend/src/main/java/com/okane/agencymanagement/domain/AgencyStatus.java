package com.okane.agencymanagement.domain;

/**
 * Logical agency status surfaced through the admin API. Persisted as a string
 * column on {@link com.okane.agency.entity.Agency} and mapped from the legacy
 * {@code active} boolean when no explicit status is stored.
 */
public enum AgencyStatus {
    ACTIVE,
    SUSPENDED,
    PENDING
}
