package com.okane.manager.dto;

import java.util.List;

public record ManagerRevenueReportResponse(
        String periodStart,
        String periodEnd,
        double totalChiffreAffaires,
        double totalCommissionAgence,
        double totalCommissionCentrale,
        double totalFraisCollectes,
        int totalTransfertsPaies,
        String devise,
        List<ManagerRevenueDayLine> byDay
) {}