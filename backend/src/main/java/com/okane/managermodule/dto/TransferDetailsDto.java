package com.okane.managermodule.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record TransferDetailsDto(
        Long id,
        String referenceCode,
        String withdrawalCode,
        String senderFullName,
        String senderPhone,
        String senderIdentityType,
        String senderIdentityNumber,
        String beneficiaryFullName,
        String beneficiaryPhone,
        String beneficiaryIdentityType,
        String beneficiaryIdentityNumber,
        BigDecimal amount,
        String currency,
        BigDecimal feeAmount,
        BigDecimal agencyCommissionAmount,
        BigDecimal centralCommissionAmount,
        BigDecimal exchangeRate,
        BigDecimal netAmount,
        String status,
        String sourceAgencyName,
        String sourceAgencyCode,
        String agentName,
        String agentEmail,
        LocalDateTime createdAt,
        LocalDateTime sentAt,
        LocalDateTime expiresAt,
        List<StatusHistoryDto> statusHistory
) {
    public record StatusHistoryDto(
            String oldStatus,
            String newStatus,
            String changedBy,
            String changedAt,
            String reason
    ) {}
}
