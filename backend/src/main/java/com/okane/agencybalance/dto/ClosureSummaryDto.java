package com.okane.agencybalance.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ClosureSummaryDto(
    Long closureId,
    Long sessionId,
    String agentName,
    String agencyName,
    BigDecimal expectedBalance,
    BigDecimal actualBalance,
    BigDecimal differenceAmount,
    String status,
    LocalDateTime closedAt,
    LocalDateTime validatedAt
) {}
