package com.okane.feemanagement.dto;

import java.math.BigDecimal;

public record TariffSimulationResponseDTO(
        BigDecimal amount,
        BigDecimal baseTransferFee,
        BigDecimal corridorPercent,
        BigDecimal corridorFee,
        BigDecimal finalTransferFee,
        BigDecimal agencyCommission,
        BigDecimal centralCommission,
        Long matchedLineId,
        Long corridorId
) {
}
