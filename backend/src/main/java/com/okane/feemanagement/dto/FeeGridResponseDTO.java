package com.okane.feemanagement.dto;

import com.okane.feemanagement.domain.FeeGridStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record FeeGridResponseDTO(
        Long id,
        String name,
        String corridor,
        String sourceCountryCode,
        String sourceCountry,
        String destinationCountryCode,
        String destinationCountry,
        String currency,
        BigDecimal minAmount,
        BigDecimal maxAmount,
        BigDecimal fixedFee,
        BigDecimal percentageFee,
        BigDecimal agencyCommissionRate,
        BigDecimal centralCommissionRate,
        FeeGridStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
