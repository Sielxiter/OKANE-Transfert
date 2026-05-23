package com.okane.currencymanagement.dto;

import com.okane.currencymanagement.domain.CurrencyStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CurrencyResponseDTO(
        Long id,
        String code,
        String name,
        String symbol,
        String mainCountry,
        String mainCountryCode,
        BigDecimal rateToMad,
        CurrencyStatus status,
        LocalDateTime lastUpdatedAt
) {
}
