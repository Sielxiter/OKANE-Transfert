package com.okane.usermanagement.domain;

/**
 * Logical account status exposed at the API surface. Maps to the existing
 * {@code enabled} / {@code accountLocked} / {@code accountSuspended} flags on
 * {@link com.okane.auth.entity.User}. The User entity is intentionally not
 * altered to avoid breaking the existing auth flow.
 */
public enum AccountStatus {
    ACTIVE,
    SUSPENDED,
    LOCKED
}
