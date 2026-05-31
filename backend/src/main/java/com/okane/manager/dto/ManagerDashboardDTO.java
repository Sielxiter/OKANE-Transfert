package com.okane.manager.dto;

import java.math.BigDecimal;

public record ManagerDashboardDTO(

        BigDecimal agencyCashBalance,

        long todayTransfersCount,
        BigDecimal todayTransfersAmount,

        BigDecimal todayFeesAmount,
        BigDecimal agencyCommission,
        BigDecimal centralShare,

        long pendingPayoutsCount,
        BigDecimal pendingPayoutsAmount,

        long activeAgentsCount,
        long totalAgentsCount,

        long unresolvedDiscrepanciesCount
) {}