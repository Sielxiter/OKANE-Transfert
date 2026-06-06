package com.okane.manager.dto;

import java.math.BigDecimal;

public record AgentCashSummary(
        Long agentId,
        String agentName,
        BigDecimal openingBalance,
        BigDecimal entries,
        BigDecimal exits,
        BigDecimal currentBalance,
        String sessionStatus
) {}
