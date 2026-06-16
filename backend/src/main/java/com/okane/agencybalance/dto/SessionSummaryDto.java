package com.okane.agencybalance.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record SessionSummaryDto(
    Long sessionId,
    String agentName,
    LocalDate sessionDate,
    BigDecimal openingBalance,
    String status,
    LocalDateTime openedAt
) {}
