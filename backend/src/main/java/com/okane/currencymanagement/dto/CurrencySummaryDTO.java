package com.okane.currencymanagement.dto;

import java.time.LocalDateTime;

public record CurrencySummaryDTO(
        long activeCurrencies,
        long activeCorridors,
        long ratesUpdatedToday,
        long suspendedCurrencies,
        LocalDateTime lastSyncAt
) {
}
