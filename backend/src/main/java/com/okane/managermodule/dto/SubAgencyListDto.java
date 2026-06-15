package com.okane.managermodule.dto;

import com.okane.agencymanagement.domain.AgencyStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record SubAgencyListDto(
        Long id,
        String name,
        String code,
        String city,
        String country,
        String phone,
        String email,
        BigDecimal dailyLimit,
        AgencyStatus status,
        long agentCount,
        long transferCountToday,
        LocalDateTime createdAt
) {}
