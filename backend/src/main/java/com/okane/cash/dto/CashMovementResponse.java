package com.okane.cash.dto;

public record CashMovementResponse(
        String id,
        String reference,
        String typeMouvement,
        double montant,
        double amountMad,
        double amountOriginal,
        String currencyOriginal,
        double exchangeRateToMad,
        String creeLe,
        String motif
) {
}
