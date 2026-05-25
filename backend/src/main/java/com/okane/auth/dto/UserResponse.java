package com.okane.auth.dto;

public record UserResponse(
        Long id,
        String firstName,
        String lastName,
        String email,
        String phone,
        String role,
        Boolean enabled,
        Boolean accountLocked,
        Boolean accountSuspended,
        AgencyResponse agency
) {
}
