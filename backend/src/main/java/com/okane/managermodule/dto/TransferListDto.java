package com.okane.managermodule.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TransferListDto(
        Long id,
        String referenceCode,
        String withdrawalCode,
        String senderFullName,
        String senderPhone,
        String beneficiaryFullName,
        String beneficiaryPhone,
        BigDecimal amount,
        String currency,
        BigDecimal feeAmount,
        BigDecimal netAmount,
        String status,
        String sourceAgencyName,
        String sourceAgencyCode,
        String agentName,
        LocalDateTime createdAt,
        LocalDateTime sentAt
) {}
