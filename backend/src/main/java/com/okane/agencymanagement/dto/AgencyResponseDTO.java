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
        Long managerId,
        String managerName,
        long agentsCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
