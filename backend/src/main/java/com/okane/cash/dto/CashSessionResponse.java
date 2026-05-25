package com.okane.cash.dto;

public record CashSessionResponse(
        String id,
        double soldeOuverture,
        double soldeActuel,
        double totalEntrees,
        double totalSorties,
        double montantAttendu,
        Double montantReel,
        double ecart,
        String statut,
        String ouverteLe,
        String clotureeLe,
        String devise,
        String commentaireCloture
) {
}
