package com.okane.managermodule.dto;

import com.okane.usermanagement.domain.AccountStatus;
import com.okane.usermanagement.domain.KycStatus;
import java.time.LocalDateTime;
import java.util.List;

public record AgentDetailsDto(
        Long id,
        String firstName,
        String lastName,
        String fullName,
        String email,
        String phone,
        AccountStatus accountStatus,
        KycStatus kycStatus,
        Long agencyId,
        String agencyName,
        String agencyCode,
        LocalDateTime lastLoginAt,
        LocalDateTime createdAt,
        long transferCountToday,
        long payoutCountToday,
        List<CashSessionSummaryDto> recentSessions
) {
    public record CashSessionSummaryDto(
            Long id,
            String sessionDate,
            String status,
            String openingBalance,
            String closingBalance,
            String difference
    ) {}
}
