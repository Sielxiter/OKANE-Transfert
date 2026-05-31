package com.okane.manager.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ManagerCashDiscrepancyDTO(
        Long id,
        Long sessionId,
        String agentName,
        String agentEmail,
        LocalDateTime reportedAt,
        BigDecimal expectedBalance,
        BigDecimal actualBalance,
        BigDecimal difference,
        String discrepancyType,  // SURPLUS ou DEFICIT
        String status,           // OPEN, RESOLVED
        String description,
        String resolvedAt,
        String resolvedBy
) {}
