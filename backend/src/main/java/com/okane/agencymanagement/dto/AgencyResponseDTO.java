package com.okane.agencymanagement.dto;

import com.okane.agencymanagement.domain.AgencyStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AgencyResponseDTO(
        Long id,
        String name,
        String code,
        String city,
        String country,
        String address,
        String phone,
        String email,
        BigDecimal dailyLimit,
        AgencyStatus status,
        String agencyType,
        Long managerId,
        String managerName,
        Long centralAgencyId,
        String centralAgencyName,
        long relatedCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
