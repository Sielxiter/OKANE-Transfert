package com.okane.currencymanagement.dto;

import java.time.LocalDateTime;
import java.util.List;

public record FxSyncResultDTO(
        boolean success,
        String source,
        LocalDateTime syncedAt,
        int updatedCurrencies,
        int skippedCurrencies,
        List<String> skippedCurrencyCodes,
        String message
) {
}
