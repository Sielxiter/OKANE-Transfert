package com.okane.currencymanagement.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ExchangeRateHistoryDTO(
        Long id,
        String currencyCode,
        String pair,
        BigDecimal oldRate,
        BigDecimal newRate,
        LocalDateTime changedAt,
        String changedByName
) {
}
