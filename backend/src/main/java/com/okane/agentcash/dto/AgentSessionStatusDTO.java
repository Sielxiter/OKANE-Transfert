package com.okane.agentcash.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record AgentSessionStatusDTO(
        boolean hasActiveSession,
        Long sessionId,
        LocalDate sessionDate,
        BigDecimal openingBalance,
        BigDecimal currentBalance,
        String status,
        LocalDateTime openedAt
) {
}
