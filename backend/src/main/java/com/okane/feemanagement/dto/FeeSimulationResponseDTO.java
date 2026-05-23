package com.okane.feemanagement.dto;

import java.math.BigDecimal;

public record FeeSimulationResponseDTO(
        BigDecimal amount,
        BigDecimal estimatedFees,
        BigDecimal netAmount,
        BigDecimal agencyCommission,
        BigDecimal centralCommission,
        String gridName,
        Long gridId,
        String currency
) {
}
