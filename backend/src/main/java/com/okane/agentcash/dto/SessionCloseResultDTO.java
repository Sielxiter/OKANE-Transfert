package com.okane.agentcash.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record SessionCloseResultDTO(
        Long closureId,
        Long sessionId,
        BigDecimal expectedBalance,
        BigDecimal actualBalance,
        BigDecimal differenceAmount,
        boolean discrepancyDetected,
        String discrepancyType,
        String message,
        LocalDateTime closedAt
) {
}
