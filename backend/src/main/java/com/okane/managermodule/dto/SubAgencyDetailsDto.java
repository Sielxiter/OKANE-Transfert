package com.okane.managermodule.dto;

import com.okane.agencymanagement.domain.AgencyStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record SubAgencyDetailsDto(
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
        long agentCount,
        long activeAgentCount,
        long transferCountToday,
        BigDecimal volumeToday,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<AgentSummaryDto> agents
) {
    public record AgentSummaryDto(
            Long id,
            String fullName,
            String email,
            String phone,
            boolean active
    ) {}
}
