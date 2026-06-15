package com.okane.clientmodule.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ClientTransferReceiptDTO(
        String reference,
        String withdrawalCode,
        String beneficiaryName,
        BigDecimal amount,
        String currency,
        BigDecimal feeAmount,
        BigDecimal netAmount,
        BigDecimal exchangeRate,
        String agencyName,
        String agentName,
        String status,
        LocalDateTime createdAt
) {
}
