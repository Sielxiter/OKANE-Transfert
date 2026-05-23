package com.okane.paymentmanagement.dto;

import com.okane.paymentmanagement.domain.PaymentStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentResponseDTO(
        Long id,
        String paymentReference,
        String transferReference,
        String withdrawalCode,
        String beneficiaryName,
        BigDecimal amountPaid,
        String currency,
        Long agencyId,
        String agencyCode,
        String agencyName,
        Long agentId,
        String agentName,
        PaymentStatus status,
        LocalDateTime paymentDate
) {
}
