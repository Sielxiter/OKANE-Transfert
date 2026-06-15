package com.okane.managermodule.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CashClosureListDto(
        Long id,
        Long sessionId,
        String agentName,
        String agentEmail,
        String agencyName,
        String agencyCode,
        String sessionDate,
        BigDecimal openingBalance,
        BigDecimal expectedBalance,
        BigDecimal actualBalance,
        BigDecimal differenceAmount,
        String status,
        String note,
        LocalDateTime closedAt,
        LocalDateTime validatedAt
) {}
