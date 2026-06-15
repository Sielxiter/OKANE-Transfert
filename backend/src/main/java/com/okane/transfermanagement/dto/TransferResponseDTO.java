package com.okane.transfermanagement.dto;

import com.okane.transfermanagement.domain.TransferStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TransferResponseDTO(
        Long id,
        String reference,
        String withdrawalCode,
        String senderFullName,
        String senderPhone,
        String senderCountry,
        String beneficiaryFullName,
        String beneficiaryPhone,
        String beneficiaryCountry,
        BigDecimal amount,
        String currency,
        BigDecimal fees,
        BigDecimal netAmount,
        String sourceCountry,
        String destinationCountry,
        TransferStatus status,
        LocalDateTime createdAt,
        Long agentId,
        String agentName,
        String agencyCode,
        String agencyName
) {
}
