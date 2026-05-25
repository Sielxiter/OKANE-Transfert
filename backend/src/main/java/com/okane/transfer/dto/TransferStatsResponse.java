package com.okane.transfer.dto;

public record TransferStatsResponse(
        double soldeCaisse,
        int transfertsJour,
        int paiementsJour,
        int transfertsEnAttente,
        String devise
) {
}
