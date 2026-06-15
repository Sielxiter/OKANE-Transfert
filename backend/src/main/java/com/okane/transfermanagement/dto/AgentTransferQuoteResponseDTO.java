package com.okane.transfermanagement.dto;

import java.math.BigDecimal;

public record AgentTransferQuoteResponseDTO(
        BigDecimal amount,
        BigDecimal baseTransferFee,
        BigDecimal corridorPercent,
        BigDecimal corridorFee,
        BigDecimal finalTransferFee,
        BigDecimal agencyCommission,
        BigDecimal centralCommission,
        BigDecimal exchangeRate,
        Long matchedLineId,
        Long corridorId
) {
}
