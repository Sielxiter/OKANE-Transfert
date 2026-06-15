package com.okane.transfermanagement.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AgentTransferResponseDTO(
        Long id,
        String reference,
        String withdrawalCode,
        String status,
        BigDecimal amount,
        BigDecimal transferFee,
        BigDecimal agencyCommission,
        BigDecimal centralCommission,
        BigDecimal netAmount,
        String senderName,
        String beneficiaryName,
        LocalDateTime createdAt
) {
}
