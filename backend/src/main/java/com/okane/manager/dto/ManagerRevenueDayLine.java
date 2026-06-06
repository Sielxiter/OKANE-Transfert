package com.okane.manager.dto;

public record ManagerRevenueDayLine(
        String date,
        int transfertsPaies,
        double fraisCollectes,
        double commissionAgence,
        double commissionCentrale,
        double chiffreAffaires
) {}