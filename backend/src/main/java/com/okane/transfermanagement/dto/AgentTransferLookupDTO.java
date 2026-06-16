package com.okane.transfermanagement.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AgentTransferLookupDTO(
        Long id,
        String referenceCode,
        String withdrawalCode,
        String senderFullName,
        String senderPhone,
        String beneficiaryFullName,
        String beneficiaryPhone,
        BigDecimal amount,
        String currencySymbol,
        BigDecimal feeAmount,
        BigDecimal netAmount,
        String status,
        LocalDateTime createdAt,
        LocalDateTime sentAt,
        LocalDateTime expiresAt,
        String sourceAgencyName,
        String sourceAgencyCode
) {
}
