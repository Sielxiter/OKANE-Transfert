package com.okane.manager.dto;

public record ManagerReportSummaryResponse(
        String date,
        int totalTransferts,
        int transfertsPaies,
        int transfertsEnAttente,
        int transfertsAnnules,
        int transfertsExpires,
        double totalMontantEnvoye,
        double totalFraisCollectes,
        double commissionAgence,
        double commissionCentrale,
        double chiffreAffaires,
        String devise
) {}