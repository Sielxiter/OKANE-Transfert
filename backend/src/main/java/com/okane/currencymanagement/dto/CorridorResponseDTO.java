package com.okane.currencymanagement.dto;

import com.okane.currencymanagement.domain.CorridorStatus;
import java.math.BigDecimal;

public record CorridorResponseDTO(
        Long id,
        String sourceCountryCode,
        String sourceCountry,
        String destinationCountryCode,
        String destinationCountry,
        String sourceCurrency,
        String destinationCurrency,
        BigDecimal estimatedFees,
        CorridorStatus status
) {
}
