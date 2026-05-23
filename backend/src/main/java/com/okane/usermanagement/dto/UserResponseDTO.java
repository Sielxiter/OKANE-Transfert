package com.okane.usermanagement.dto;

import com.okane.usermanagement.domain.AccountStatus;
import com.okane.usermanagement.domain.KycStatus;
import java.time.LocalDateTime;

public record UserResponseDTO(
        Long id,
        String firstName,
        String lastName,
        String fullName,
        String email,
        String phone,
        String role,
        AccountStatus accountStatus,
        String country,
        KycStatus kycStatus,
        Long agencyId,
        String agencyName,
        String agencyCode,
        LocalDateTime createdAt,
        LocalDateTime lastLoginAt
) {
}
