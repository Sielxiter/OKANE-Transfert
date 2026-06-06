package com.okane.manager.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ManagerCashClosureDTO(
        Long id,
        Long sessionId,
        String agentName,
        String closedBy,
        LocalDateTime closedAt,
        BigDecimal expectedBalance,
        BigDecimal actualBalance,
        BigDecimal difference,
        String note
) {}
