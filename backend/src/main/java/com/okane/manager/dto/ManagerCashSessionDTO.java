package com.okane.manager.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record ManagerCashSessionDTO(
        Long id,
        String agentId,
        String agentName,
        String agentEmail,
        LocalDate sessionDate,
        BigDecimal openingBalance,
        BigDecimal totalEntries,
        BigDecimal totalExits,
        BigDecimal currentBalance,
        String status,
        LocalDateTime openedAt,
        LocalDateTime closedAt
) {}
