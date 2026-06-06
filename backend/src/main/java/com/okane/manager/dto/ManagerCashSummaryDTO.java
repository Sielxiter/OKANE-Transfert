package com.okane.manager.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ManagerCashSummaryDTO(
        LocalDate date,
        AgencyCashSummary agencySummary,
        List<AgentCashSummary> agentsSummary,
        int openSessionsCount,
        int pendingDiscrepanciesCount
) {}

