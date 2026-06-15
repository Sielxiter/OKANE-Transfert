package com.okane.feemanagement.domain;

/**
 * Logical fee-grid status surfaced through the admin API.
 *
 * <p>Maps to the legacy {@code active} boolean on
 * {@link com.okane.feescommission.entity.FeeGrid}:
 * <ul>
 *   <li>{@code active = true}, {@code effectiveFrom != null} → {@link #ACTIVE}</li>
 *   <li>{@code active = false} → {@link #SUSPENDED}</li>
 *   <li>{@code active = true} but no effective range yet → {@link #DRAFT}</li>
 * </ul>
 */
public enum FeeGridStatus {
    ACTIVE,
    SUSPENDED,
    DRAFT
}
